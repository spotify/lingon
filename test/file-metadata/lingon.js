#!/usr/bin/env node

var es = require('event-stream');
var lingon = require('../../lib/boot');
var ejs = require('gulp-ejs');
var streamHelper = require('../../lib/utils/stream');

console.log(lingon.preProcessor('ejs'))

lingon.preProcessor('ejs').unshift(function(context) {
  return es.map(function(file, cb) {
      if(!context.metadata) {
        context.metadata = {};
      }
      
      console.log('metadata: ', file.path)

      context.metadata[file.path] = "Hello";
      cb(null, file);
    });
});
