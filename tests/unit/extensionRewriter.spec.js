var test                      = require('tape');
var ExtensionRewriter         = require('../../lib/utils/extensionRewriter');

test("ExtensionRewriter: can perform single transform", function(t) {
  var source = 'index.coffee';

  var extensionMap = {'coffee': 'js'};

  var dest = ExtensionRewriter.transform({
    filename: source,
    extensionMap: extensionMap
  });

  t.equals(dest, 'index.js');

  t.end();
});

test("ExtensionRewriter: can transform multi-segmented extensions", function(t) {
  var source = 'data.json.ejs';

  // It's important the ejs is defined before json.ejs
  // we need to test that this list is ordered based
  // on token size. Multiple-extension tokens should 
  // be processed first.
  var extensionMap = {
    'ejs': 'html',
    'json.ejs': 'json'
  };

  var dest = ExtensionRewriter.transform({
    filename: source,
    extensionMap: extensionMap
  });

  t.equals(dest, 'data.json');

  t.end();
});

test("ExtensionRewriter: can remove an extension", function(t) {
  var source = 'lib.min.js';

  // It's important the ejs is defined before json.ejs
  // we need to test that this list is ordered based
  // on token size. Multiple-extension tokens should 
  // be processed first.
  var extensionMap = {
    'min': ''
  };

  var dest = ExtensionRewriter.transform({
    filename: source,
    extensionMap: extensionMap
  });

  t.equals(dest, 'lib.js');

  t.end();
});

test("ExtensionRewriter: can reverse transform a destination filename to a list of candidates", function(t) {
  var dest = 'index.ignored.html';

  var extensionMap = {
    "ejs": "html",
    "haml": "html",
    "jade": "html",
    "kit": "html",
    "md": "html",
    "slim": "html"
  };

  var source = ExtensionRewriter.reverseTransform({
    filename: dest,
    extensionMap: extensionMap
  });

  var isInArray = source.indexOf('index.ignored.jade') > -1;

  t.equals(isInArray, true);

  t.end();
});

