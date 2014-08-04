#!/usr/bin/env node

var lingon = require('../../lib/boot'),
    markdown = require('gulp-markdown');

lingon.validDirectiveFileTypes.push('.md');

// compile markdown files into html
lingon.preProcessor('md', function() {
  return markdown();
});
