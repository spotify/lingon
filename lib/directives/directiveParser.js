var path       = require('path');
var shellwords = require('shellwords').split;

var DirectiveParser = function(directives) {
  this.directives = directives;
};

// A RegExp to find the 'directive header' in a file.
DirectiveParser.prototype.HEADER_PATTERN = new RegExp(
  '^(?:\\s*' +
    '(' +
      '(?:\/[*](?:\\s*|.+?)*?[*]\/)' + '|' +
      '(?:\/\/.*\n?)+' + '|' +
      '(?:#=.*\n?)+' + '|' +
      '(?:<!-- lingon:.*\n?)+' +
    ')*' +
  ')*', 'm'
);

DirectiveParser.prototype.DIRECTIVE_PATTERN = new RegExp(
  '^\\W*(=|lingon:)\\s*(\\w+.*?)(\\*\\/|-->)?$'
);


DirectiveParser.prototype.parse = function(sourceFile) {
  return 'maybe';
}

module.exports = DirectiveParser;