#!/usr/bin/env node

var lingon = require('../../lib/boot');
var markdown = require('gulp-markdown');

lingon.preProcessor('md', function() {
  return markdown();
});