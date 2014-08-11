#!/usr/bin/env node

var es = require('event-stream');
var lingon = require('../../lib/boot');
var ejs = require('gulp-ejs');
var streamHelper = require('../../lib/utils/stream');

lingon.preProcessor('ejs').unshift(function(context, global) {
  return es.map(function(file, cb) {
      if(!global.metadata) {
        global.metadata = {};
      }

      global.metadata[file.path] = "Hello";
      console.log(context, global)
      cb(null, file);
    });
});
