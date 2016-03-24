var assert = require('assert');
var parser = require('./../index');

describe('strip', function() {
  it('should remove punctuation', function() {
    var stripped = parser.strip("St. Louis, Mo.");
    assert(stripped == "St Louis Mo");
  });

  it('should put a space after a commma with no space after', function() {
    var stripped = parser.strip("St. Louis,Mo.");
    assert(stripped == "St Louis Mo");
  });

});

describe.skip('transformCity', function() {

  it('should change st to saint', function() {
    var city = parser.transformCity("St Louis");
    assert(city == "Saint Louis");

    var city = parser.transformCity("st louis");
    assert(city == "Saint louis");
  });

  it('should change mt to mount', function() {
  });

  it('should change mt to mount', function() {
  });

  it('should only find an alias at the beginning of a string', function() {
  });

  it('should only find an alias at the beginning of a string', function() {
  });
});

describe('tokenize', function() {

  it('should return an array with an empty string when given an empty string', function() {
    var t = parser.tokenize('');
    assert(t[0] == '');
  });

  it('should return 1 item', function() {
    var t = parser.tokenize('chicago');
    assert(t.length == 1);

    var t = parser.tokenize('chicago     ');
    assert(t.length == 1);

    var t = parser.tokenize('   chicago');
    assert(t.length == 1);

    var t = parser.tokenize('    chicago      ');
    assert(t.length == 1);
  });

  it('should return 2 items', function() {
    var t = parser.tokenize('chicago illinois');
    assert(t.length == 2);

    var t = parser.tokenize('chicago, illinois');
    assert(t.length == 2);

    var t = parser.tokenize('chicago,illinois');
    assert(t.length == 2);

    var t = parser.tokenize('    chicago illinois');
    assert(t.length == 2);

    var t = parser.tokenize('chicago illinois    ');
    assert(t.length == 2);

    var t = parser.tokenize('    chicago illinois      ');
    assert(t.length == 2);

    var t = parser.tokenize('    chicago        illinois      ');
    assert(t.length == 2);
  });

  it('should return items with no spaces anywhere', function () {
    var t = parser.tokenize('las vegas new mexico');
    var withSpaces = t.filter(function(d) { return d.match(/\s/g); });
    assert(withSpaces.length == 0);

    var t = parser.tokenize(' las vegas new mexico ');
    var withSpaces = t.filter(function(d) { return d.match(/\s/g); });
    assert(withSpaces.length == 0);

    var t = parser.tokenize('las vegas,new mexico');
    var withSpaces = t.filter(function(d) { return d.match(/\s/g); });
    assert(withSpaces.length == 0);

    var t = parser.tokenize('  las      vegas    new   mexico     ');
    var withSpaces = t.filter(function(d) { return d.match(/\s/g); });
    assert(withSpaces.length == 0);
  });

});

describe('lastToken', function() {

  it('should return the last token', function() {
    var last = parser.lastToken(['chicago', 'illinois']);
    assert(last == 'illinois');

    var last = parser.lastToken(['chicago']);
    assert(last == 'chicago');
  });

  it('should return null when given an empty array', function() {
    var last = parser.lastToken([]);
    assert(last == null);
  });

});

describe('lastTwoTokens', function() {

  it('should return the last 2 tokens when given at least 2 tokens', function() {
    var loc = ['las', 'vegas', 'new', 'mexico'];
    var lastTwo = parser.lastTwoTokens(loc);
    assert(lastTwo.length == 2);
    assert(lastTwo[0] == 'new');
    assert(lastTwo[1] == 'mexico');
  });

  it('should return null when given an array with length less than 2', function() {
    var loc = ['chicago'];
    var lastTwo = parser.lastTwoTokens(loc);
    assert(lastTwo == null);
  });

});

describe('pinchState', function() {

  it('should return original value in rest if a state is not found', function() {
    var result = parser.pinchState('chicago, miaslkj');
    assert(result.state.length == 0);
    assert(result.rest == 'chicago, miaslkj');

    var result = parser.pinchState('illinois, chicago');
    assert(result.state.length == 0);
    assert(result.rest == 'illinois, chicago');

    var result = parser.pinchState('illinois,chicago');
    assert(result.state.length == 0);
    assert(result.rest == 'illinois,chicago');

    var result = parser.pinchState('illinois new jersey illinois xissouri');
    assert(result.state.length == 0);
    assert(result.rest == 'illinois new jersey illinois xissouri');
  });

  describe('state abbreviations', function() {

    it('should handle a state abbreviation at the end of a string', function() {
      var result = parser.pinchState('chicago, il');
      assert(result.state == 'IL');
      assert(result.rest == 'chicago');

      var result = parser.pinchState('selby, sd');
      assert(result.state == 'SD');
      assert(result.rest == 'selby');

      var result = parser.pinchState('selby,sd');
      assert(result.state == 'SD');
      assert(result.rest == 'selby');

      var result = parser.pinchState('las vegas, nm');
      assert(result.state == 'NM');
      assert(result.rest == 'las vegas');
    });

    it('should not care about whitespace', function() {
      var result = parser.pinchState('    las    vegas    ,  nm   ');
      assert(result.state == 'NM');
      assert(result.rest == 'las vegas');
    });

    it('should not care about periods', function() {
      var result = parser.pinchState('    las    vegas    ,  n.  m.   ');
      assert(result.state == 'NM');
      assert(result.rest == 'las vegas');

      var result = parser.pinchState('st. louis, mo.');
      assert(result.state == 'MO');
      assert(result.rest == 'st louis');
    });

  });

  describe('full state names', function() {

    it('should not care about commas', function() {
      var result = parser.pinchState('chicago, illinois');
      assert(result.state == 'IL');
      assert(result.rest == 'chicago');

      var result = parser.pinchState('chicago,illinois');
      assert(result.state == 'IL');
      assert(result.rest == 'chicago');

      var result = parser.pinchState('   chicago   ,  illinois   ');
      assert(result.state == 'IL');
      assert(result.rest == 'chicago');

      var result = parser.pinchState('   las, vegas  new mexico   ');
      assert(result.state == 'NM');
      assert(result.rest == 'las vegas');

      var result = parser.pinchState('   las vegas  new, mexico   ');
      assert(result.state == 'NM');
      assert(result.rest == 'las vegas');
    });

    it('should find a state at the end of the string', function() {
      assert(parser.pinchState("chicago Illinois").state == "IL");
      assert(parser.pinchState("chicago,Illinois").state == "IL");
      assert(parser.pinchState("chicago Illinois").rest == 'chicago');
      assert(parser.pinchState("selby south Dakota").state == "SD");
      assert(parser.pinchState("selby south Dakota").rest == "selby");
      assert(parser.pinchState("columbia South carolina").state == "SC");
      assert(parser.pinchState("columbia South carolina").rest == "columbia");
      assert(parser.pinchState("LAS VEGAS New mexico").state == "NM");
      assert(parser.pinchState("LAS VEGAS New mexico").rest == "las vegas");
    });

    it('should not care about periods in cities', function() {
      assert(parser.pinchState("bay st. louis, mississippi").state == "MS");
      assert(parser.pinchState("bay st. louis, mississippi").rest == "bay st louis");
    });

    it('should find a state when given only a state', function() {
      assert(parser.pinchState('Indiana').state == 'IN');
      assert(parser.pinchState('Indiana').rest == '');
    });

    it('should not find a state when not given a state', function() {
      assert(parser.pinchState('hello').state == '');
      assert(parser.pinchState('hello').rest == 'hello');

      assert(parser.pinchState('hellokansas').state == '');
      assert(parser.pinchState('hellokansas').rest == 'hellokansas');
    });

    it('should find a state when the state contains another state name', function() {
      assert(parser.pinchState("hope arkansas").state == "AR");
      assert(parser.pinchState("hope arkansas").rest == "hope");
      assert(parser.pinchState("wichita kansas").state == "KS");
      assert(parser.pinchState("wichita kansas").rest == "wichita");
    });

    it('should find a state name with more than one state in value', function() {
      assert(parser.pinchState("ohio illinois").state == "IL");
      assert(parser.pinchState("ohio illinois").rest == "ohio");
    });

    it('should find a state name when value repeats state name', function() {
      assert(parser.pinchState("new york new york").state == "NY");
      assert(parser.pinchState("new york new york").rest == "new york");
      assert(parser.pinchState("new york,new york").state == "NY");
      assert(parser.pinchState("new york,new york").rest == "new york");
    });

    it('should not care about extra spaces', function() {
      assert(parser.pinchState("  chicago    illinois ").state == "IL");
      assert(parser.pinchState("  chicago    illinois ").rest == "chicago");
      assert(parser.pinchState("  selby    south    dakota   ").state == "SD");
      assert(parser.pinchState("  selby    south    dakota   ").rest == "selby");
      assert(parser.pinchState(" columbia       south   carolina  ").state == "SC");
      assert(parser.pinchState(" columbia       south   carolina  ").rest == "columbia");
      assert(parser.pinchState("    las    vegas     new       mexico  ").state == "NM");
      assert(parser.pinchState("    las    vegas     new       mexico  ").rest == "las vegas");
      assert(parser.pinchState("   hope     arkansas ").state == "AR");
      assert(parser.pinchState("   hope     arkansas ").rest == "hope");
      assert(parser.pinchState("   wichita    kansas    ").state == "KS");
      assert(parser.pinchState("   wichita    kansas    ").rest == "wichita");
      assert(parser.pinchState("   ohio    illinois  ").state == "IL");
      assert(parser.pinchState("   ohio    illinois  ").rest == "ohio");
      assert(parser.pinchState("      new  york    new    york  ").state == "NY");
      assert(parser.pinchState("      new  york    new    york  ").rest == "new york");
    });

  });

});

describe('getStateAbbrev', function() {

  it('should return an abbreviation when given a full state', function() {
    assert(parser.getStateAbbrev('illinois') == 'IL');
    assert(parser.getStateAbbrev('Illinois') == 'IL');
    assert(parser.getStateAbbrev('IllInOis') == 'IL');
    assert(parser.getStateAbbrev('  IllInOis ') == 'IL');
  });

});

describe('pinchZip', function() {

  it('should find a 5-digit zip at the end', function() {
    var result = parser.pinchZip('Boston, MA 02134');
    assert(result.zip == '02134');

    var result = parser.pinchZip('    Boston  ,  MA      02134   ');
    assert(result.zip == '02134');
  });

  it('should find a zip with no spaces before it', function() {
    var result = parser.pinchZip('aberdeen,sd57401');
    assert(result.zip == '57401');
    assert(result.rest == 'aberdeen sd');
  });

});

describe('parseLocation', function() {
  
  it('should handle a value with a comma', function() {
    var loc = parser.parseLocation("chicago, il");
    assert(loc.city == "chicago");
    assert(loc.state == "IL");
    assert(loc.zip == undefined);

    var loc = parser.parseLocation("las vegas, new mexico");
    assert(loc.city == "las vegas");
    assert(loc.state == "NM");
    assert(loc.zip == undefined);

    var loc = parser.parseLocation("green, ks");
    assert(loc.city == "green");
    assert(loc.state == "KS");
    assert(loc.zip == undefined);

    var loc = parser.parseLocation("st. louis,mo");
    assert(loc.city == "st louis");
    assert(loc.state == "MO");
    assert(loc.zip == undefined);

    var loc = parser.parseLocation('jonesboro, Ar. 72401');
    assert(loc.city == "jonesboro");
    assert(loc.state == "AR");
    assert(loc.zip == "72401");
  });

  it('should handle no spacing', function() {
    var loc = parser.parseLocation('jonesboro,Ar.72401');
    assert(loc.city == "jonesboro");
    assert(loc.state == "AR");
    assert(loc.zip == "72401");

    var loc = parser.parseLocation('jonesboro,Ar.72401');
    assert(loc.city == "jonesboro");
    assert(loc.state == "AR");
    assert(loc.zip == "72401");

    var loc = parser.parseLocation("chicago,il");
    assert(loc.city == "chicago");
    assert(loc.state == "IL");
    assert(loc.zip == undefined);

    var loc = parser.parseLocation("las vegas,new mexico");
    assert(loc.city == "las vegas");
    assert(loc.state == "NM");
    assert(loc.zip == undefined);

  });

});

