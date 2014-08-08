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
      '(?:#=.*\n?)+' + '|' +
      '(?:<!-- lingon:.*\n?)+' +
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
var DIRECTIVE_PATTERN = new RegExp('^\\W*(=|lingon:)\\s*(\\w+.*?)(\\*\\/|-->)?$');

function parse(header) {
  var lines = get_lines(header);
  var directives = [];

  for(var index in lines) {
    var line = lines[index];

    var matches = DIRECTIVE_PATTERN.exec(line), name, args;
    if (matches && matches[2]) {
      args = shellwords(matches[2]);
      name = args.shift();
      directives.push([index + 2, name, args]);
    }

  }
  return directives;
}

var BODY_DIRECTIVE_PATTERN = new RegExp('<!-- lingon:(.*) -->');

function parseBody(body) {
  var lines = get_lines(body);
  var directives = [];

  var needsExpansion = false;
  // First, get all inline directives
  for(var index in lines) {
    var line = lines[index];
    var matches = BODY_DIRECTIVE_PATTERN.exec(line), name, args;

    if (matches && matches[1]) {

      args = shellwords(matches[1]);
      name = args.shift();
      if(name == 'include') {
        needsExpansion = true;
      }

      directives.push([index, name, args]);
    }

  }

  //Do we have inline includes?
  if(needsExpansion) {
    return expandInlineDirectives(directives, lines);
  }else{
    return directives;
  }

};

function expandInlineDirectives(directives, lines) {
  var lastDirectiveIndex = 0;
  var expandedDirectives = [];

  for(var i=0;i<directives.length;i++) {
    var directive = directives[i];
    var index = parseInt(directive[0]);

    if(index > lastDirectiveIndex) {
      var c1 = lines.slice(lastDirectiveIndex, index).join("\n");
      expandedDirectives.push([lastDirectiveIndex, 'include_inline', {contents: c1}]);
    }

    expandedDirectives.push(directive);

    lastDirectiveIndex = index+1;
  }

  if(index < lines.length-1) {
    var c2 = lines.slice(index+1, lines.length).join("\n");
    expandedDirectives.push([index + 1, 'include_inline', {contents: c2}]);
  }

  return expandedDirectives;
};

function directiveParser(filePath, data) {
  var header = (HEADER_PATTERN.exec(data) || []).shift() || '';
  header = header.replace(/([\n\r]){2,}$/, '$1');

  var directives = parse(header);
  var body = String(data).replace(header, '');

  var bodyDirectives = parseBody(body);

  directives = directives.concat(bodyDirectives);

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

        patterns.push({index: i, type: 'include_glob', args: args});
      break;
      case 'include_inline':
        patterns.push({index: i, type: 'include_inline', args: args});
      break;
      case 'layout':
        patterns.push({index: i, type: 'layout', args: {contents: body, layout: args[0]}});
      break;
      case 'include_self':
        if(patterns.indexOf('self') > -1) {
          throw('Lingon: Multiple "include_self" directives found in ' + filePath);
        }

        patterns.push({index: i, type: 'include_self', args: {contents: body}});
      break;
    }
  }

  // Add an implicit include_self at the end if none was declared.
  var found = false;
  for(i=0;i<patterns.length;i++) {
    if(patterns[i].type == 'include_self' || patterns[i].type == 'include_inline' || patterns[i].type == 'layout') {
      found = true;
    }
  }

  if(!found) {
    patterns.push({type: 'include_self', args: {contents: body}});
  }

  return {
    directives: directives,
    patterns: patterns
  };
}

module.exports = directiveParser;
