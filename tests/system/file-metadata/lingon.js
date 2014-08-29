#!/usr/bin/env node

var es = require('event-stream');
var lingon = require('../../../lib/boot');
var ejs = require('gulp-ejs');
var streamHelper = require('../../../lib/utils/stream');

lingon.preProcessors.unshift('ejs', function(global, context) {
  return es.map(function(file, cb) {
      if(!global.metadata) {
        global.metadata = {};
      }

      global.metadata[file.path] = 'Hello';
      cb(null, file);
    });
});
