var path = require('path');
var Lexer = require('lex');

var ExtensionRewriter = {};

function validateArgs(args) {
  if(typeof args.filename === 'undefined') {
    throw("ExtensionRewriter: Error, filename is undefined.")
  }

  if(typeof args.extensionMap === 'undefined') {
    throw("ExtensionRewriter: Error, extensionMap is undefined.")
  }

  return args;
}

ExtensionRewriter.transform = function(args) {
  // Validate the function arguments
  args = validateArgs(args);

  // Get the base filename, without any extensions.
  var baseName = args.filename.split('.')[0];

  // Get all defined patterns
  var patterns = Object.keys(args.extensionMap);

  // Sort the patterns according to token size
  patterns = patterns.sort(function(a, b) {
    var al = (a.match(/./g) || []).length;
    var bl = (b.match(/./g) || []).length;

    if(al < bl) {
      return -1;
    }

    if(al > bl) {
      return 1;
    }

    return 0
  }).reverse(); // Reverse array after sort, we want largest on top.

  // Prepare an array for output
  var segments = [];

  // Instantiate a lexer
  // Pass in a default function that will add all
  // unmatched chars to the segments array.
  var lexer = new Lexer(function (char) {
    segments.push(char);
  });

  // Create a lexer rule for each defined input extensions.
  // When triggered, push the mapped extension based on the input.
  patterns.forEach(function(pattern) {
    var rule = new RegExp("\\." + pattern);

    lexer.addRule(rule, function() {
      try {
        var mappedExtension = args.extensionMap[pattern].rewrite;

        // Do not push the mapped extensions if it's an empty string.
        // We want to igore empty mappings.
        if(mappedExtension && mappedExtension.length > 0) {
          segments.push("." + mappedExtension);
        }
      }catch(e) {
        console.log('Lingon.ExtensionWriter: Fatal error: No such rewrite', pattern);
      }
    });
  });

  // Feed the lexer
  lexer.input = args.filename;

  // Run lexer
  lexer.lex();

  // Return the basename + new extensions in order, or empty basename.
  return segments.join('');

};

ExtensionRewriter.reverseTransform = function(args) {
  // Validate the function arguments
  args = validateArgs(args);

  var segments = args.filename.split('.');
  var baseName = segments[0];
  segments = segments.slice(1);

  function getKeysByValue(map, value) {
    var keys = [];

    for(var prop in map) {
      if(map.hasOwnProperty(prop)) {
        if(map[prop].rewrite === value)
          keys.push(prop);
      }
    }

    return keys;
  }

  var candidates = segments.map(function(segment) {
    // If we have a mapping for current extensions, fetch it's
    // possible source extensions.
    var candidateExtensions = getKeysByValue(args.extensionMap, segment);

    candidateExtensions = candidateExtensions.map(function(candidate) {
      return "." + candidate;
    });

    if(candidateExtensions.length > 0) {
      return candidateExtensions;
    }else{
      return ["." + segment];
    }

  });

  function allCombinations(arr) {
    if (arr.length == 1) {
      return arr[0];
    } else {
      var result = [];
      var allCasesOfRest = allCombinations(arr.slice(1));  // recur with the rest of array
      for (var i = 0; i < allCasesOfRest.length; i++) {
        for (var j = 0; j < arr[0].length; j++) {
          result.push(arr[0][j] + allCasesOfRest[i]);
        }
      }
      return result;
    }

  }

  var filenames = allCombinations([[baseName]].concat(candidates));

  return filenames;
};

module.exports = ExtensionRewriter;
