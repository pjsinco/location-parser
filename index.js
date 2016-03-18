var querystring = require('querystring');
var url = require('url');
var madison = require('madison');
var states = madison.states;

module.exports = {

  hasZip: function(searchLocation) {
    var matches = searchLocation.match(/\d+/g);
    return matches && matches.length > 0;
  },

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
   * Determines if value has only 1 comma
   *
   */
  hasValidComma: function(value) {
    return value.match(/,/g).length === 1;
  },

  /**
   * Determines if value has a comma
   *
   */
  hasComma: function(value) {
    return Boolean (value.match(/,/g));
  },

  /**
   * Split into array of tokens.
   *
   */
  tokenize: function(value) {
    var stripped = this.strip(value);
    return stripped.toLowerCase().trim().split(' ');
  },

  splitByComma: function(value) {
    return;
  },

  /**
   * Return array of tokens *not* containing the last token
   *
   */
  allButLastToken: function(tokens) {
    var length = tokens.length;
    
    //return tokens(0, )
  },

  /**
   * Return array of tokens *not* containing last 2 tokens
   *
   */
  allButLastTwoTokens: function(tokens) {

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
    var spaceStripped = value.replace(/\s+/gm, ' ').trim();
    var punctStripped = spaceStripped.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
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
      return lastWord.indexOf(state.name.toLowerCase()) === 0;
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
        state = stateFromTwoWords;

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

  pinchCity: function(value) {

  },

  pinchZip: function(value) {
    var stripped = this.strip(value);
    var tokens = this.tokenize(stripped);
    var zip, rest, matches;

    for (var i = 0, l = tokens.length; i < l; i ++) {
      var matches = tokens[i].match(/\b(\d{5})\b/g, '$1');
      if (matches && matches.length === 1) {
        zip = matches[0];
        tokens.splice(i, 1);
      }
    }

    return {
      zip: zip,
      rest: tokens.join(' ')
    };
  },

  /**
   * @param {string} value
   */
  parseLocation: function(value) {

    var pinchedZip = this.pinchZip(value);

    if (pinchedZip.zip) {
      zip = pinchedZip.zip;
    } else {
      zip = null;
    }

    var pinchedState = this.pinchState(pinchedZip.rest);

    return {
      city: pinchedState.rest,
      state: pinchedState.state,
      zip: zip
    };

  },

};
