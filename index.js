var querystring = require('querystring');
var madison = require('madison');
var states = madison.states;

module.exports = {

  /* NOT USED */
  getStateAbbrev: function(fullStateName) {
    var stateAbbrev;

    if (fullStateName.trim().length === 2) {
      stateAbbrev = fullStateName;
    } else {
      stateAbbrev = madison.getStateAbbrevSync(fullStateName.trim());
    }

    return stateAbbrev;
  },

  /**
   * Split into array of tokens.
   *
   */
  tokenize: function(value) {
    var stripped = this.strip(value);
    return stripped.toLowerCase().trim().split(' ');
  },

  /**
   * Return the last token from an array of tokens
   *
   */
  lastToken: function(tokens) {
    if (tokens.length === 0) { 
      return null;
    }

    return tokens.slice(-1)[0];
  },

  /**
   * Return the last 2 tokens from an array of tokens
   *
   */
  lastTwoTokens: function(tokens) {
    var lastTwo = tokens.slice(-2);

    if (lastTwo.length !== 2) {
      return null;
    }

    return lastTwo;
  },

  isValidStateAbbrev: function(value) {
    return Boolean (madison.getStateNameSync(value));
  },

  strip: function(value) {
    var commaSpaceStripped = value.replace(/\s+|,/gm, ' ').trim();
    var punctStripped = commaSpaceStripped.replace(/[.\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
    var withStragglersGrouped = punctStripped.replace(/(\w)\s(\w)$/g, '$1$2');
    return withStragglersGrouped.replace(/\s{2,}/g, ' ');
  },

  /**
   * Pull out the state from a string. The state must be at the end of the string.
   *
   * Return an object of the form: 
   *
   * {
   *   state: <string: state abbreviation>,
   *   rest: <string: remaining tokens minus the state>
   * }
   *
   */
  pinchState: function(value) {

    var state, rest, stateFromOneWord, stateFromTwoWords;

    var stripped = this.strip(value);
    var tokens = this.tokenize(stripped);
    var lastWord = this.lastToken(tokens);

    // Handle an abbreviation, if we have one at the end
    if (this.isValidStateAbbrev(lastWord)) {
      return {
        state: lastWord.toUpperCase(),
        rest: tokens.slice(0, -1).join(' ')
      };
    }

    // First try the last word ...
    stateFromOneWord = states.filter(function(state) {
      var re = new RegExp('^' + state.name.toLowerCase() + '$', "gi");
      return re.test(lastWord);
    });


    // If that fails, try the last 2 words ...
    if (stateFromOneWord.length === 0) {
      var lastTwoWords = this.lastTwoTokens(tokens);
      if (!lastTwoWords) { 
        // We can't find anything
        return {
          state: '',
          rest: value
        };
      } else {
        lastTwoWords = lastTwoWords.join(' ');
        stateFromTwoWords = states.filter(function(state) {
          return lastTwoWords.indexOf(state.name.toLowerCase()) === 0 &&
            Boolean(state.name.match(/\s/g)); // make sure state has 2 words
        });
        state = (stateFromTwoWords.length === 0 ? '' : stateFromTwoWords);

        if (state.length > 0) {
          rest = tokens.slice(0, -2).join(' ');
        } else {
          rest = value;
        }
      }
    } else {
      state = stateFromOneWord;
      rest = tokens.slice(0, -1).join(' ');
    }
    
    if (state.length > 1) {
      throw new Error('Found more than one state');
    } else if (state.length === 1) {
      return {
        state: state[0].abbr,
        rest: rest
      };
    } else {
      return {
        state: state,
        rest: rest
      };
    }
    
  },


  /**
   * Transform common city abbreviations:
   *   St. -> Saint
   *   Mt. -> Mount
   *   Ft. -> Fort
   *
   */
  transformCity: function (city) {
    
    if (city.match(/^st\b/gi)) {
      return city.replace(/^(st)\b/gi, 'Saint');
    } else if (city.match(/^mt\b/gi)) {
      return city.replace(/^(mt)\b/gi, 'Mount');
    } else if (city.match(/^ft\b/gi)) {
      return city.replace(/^(ft)\b/gi, 'Fort');
    }

    return city;
  },

  pinchZip: function(value) {
    var stripped = this.strip(value);
    var tokens = this.tokenize(stripped);
    var zip, notZip, rest, matches;

    for (var i = 0, l = tokens.length; i < l; i ++) {
      var matches = tokens[i].match(/\d{5}$/g);
      if (matches && matches.length === 1) {
        if (matches[0] === tokens[i]) {
          if (matches[0].length === 5) {
            zip = matches[0];
            tokens.splice(i, 1);
          }
          break;
        } else { // we have some nondigits at the front
          // zip goes to front of zipTokens
          var zipString = tokens[i].replace(/^(.*)(\d{5}$)/gi, '$2 $1');
          var zipTokens = this.tokenize(zipString);
          zip = zipTokens[0];
          notZip = zipTokens[1];
          tokens.splice(i, 1);
          break;
        }
      }
    }

    if (notZip) {
      tokens.push(notZip);
    } 

    rest = tokens.join(' ');

    //if (zip && zip.length === 5) {
      return {
        zip: zip,
        rest: rest
      };
    //} else {
    //  return {
    //    rest: null,
    //    rest: stripped
    //  };
    //}

  },

  /**
   * @param {string} value
   * @param {boolean} resolveCityAlias - whether to transform St. to Saint, etc.
   */
  parseLocation: function(value, resolveCityAlias) {

    var resolveCity = resolveCityAlias || false;

    var pinchedZip = this.pinchZip(value);

    if (pinchedZip.zip) {
      return {
        zip: pinchedZip.zip,
        city: '',
        state: null,
      };
    } else {
      zip = null;
    }

    var pinchedState = this.pinchState(pinchedZip.rest);

    return {
      city: (resolveCity ? this.transformCity(pinchedState.rest) :
        pinchedState.rest),
      state: pinchedState.state,
      zip: zip
    };

  },

};
