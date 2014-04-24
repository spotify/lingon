var path       = require('path');
var shellwords = require('shellwords').split;

// Directive parsing is inspired by the implementation in mincer:
// https://github.com/nodeca/mincer/blob/master/lib/mincer/processors/directive_processor.js

// Returns an Array of lines.
function get_lines(str) {
  return String(str || '').match(/^.*$/gm);
}

// Directives will only be picked up if they are in the header
// of the source file. C style (/* */), JavaScript (//), and
// Ruby (#) comments are supported.
//
// Directives in comments after the first non-whitespace line
// of code will not be processed.
var HEADER_PATTERN = new RegExp(
  '^(?:\\s*' +
    '(' +
      '(?:\/[*](?:\\s*|.+?)*?[*]\/)' + '|' +
      '(?:\/\/.*\n?)+' + '|' +
      '(?:#.*\n?)+' +
    ')*' +
  ')*', 'm');


// Directives are denoted by a `=` followed by the name, then
// argument list.
//
// A few different styles are allowed:
//
//     // =include foo
//     //= include foo
//     //= include "foo"
//
var DIRECTIVE_PATTERN = new RegExp('^\\W*=\\s*(\\w+.*?)(\\*\\/)?$');

function parse(header) {
  var lines = get_lines(header);
  var directives = [];

  for(var index in lines) {
    var line = lines[index];

    var matches = DIRECTIVE_PATTERN.exec(line), name, args;

    if (matches && matches[1]) {
      args = shellwords(matches[1]);
      name = args.shift();

      if('include'.indexOf(name) > -1) {
        directives.push([index + 1, name, args]);
      }else if('include_self'.indexOf(name) > -1) {
        directives.push([index + 1, name, args]);
      }
    }

  }

  return directives;
}

function directiveParser(filePath, data) {
  var header = (HEADER_PATTERN.exec(data) || []).shift() || '';
  header = header.replace(/([\n\r]){2,}$/, '$1');

  var directives = parse(header);
  var body = String(data).replace(header, '');

  var patterns = [];
  for(var i=0;i<directives.length;i++) {
    var directive = directives[i];
    var directiveType = directive[1];
    var args = directive[2];

    switch(directiveType) {
      case 'include':
        var absolutePath = path.dirname(path.resolve(filePath));

        args = args.map(function(argument) {
          var prefix = '';

          if(argument.charAt(0) === '!') {
            prefix = '!';
            argument = argument.substring(1);
          }

          return prefix + path.join(absolutePath, argument);
        });

        patterns.push(args);
      break;
      case 'include_self':
        if(patterns.indexOf('self') > -1) {
          throw('Lingon: Multiple "include_self" directives found in ' + filePath);
        }

        patterns.push('self');
      break;
    }
  }

  // Add an implicit include_self at the end if none was declared.
  if(patterns.indexOf('self') === -1) {
    patterns.push('self');
  }

  return {
    header: header,
    body: body,
    directives: directives,
    patterns: patterns
  };
}

module.exports = directiveParser;
