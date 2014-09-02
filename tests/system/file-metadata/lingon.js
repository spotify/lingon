#!/usr/bin/env node

var es = require('event-stream');
var lingon = require('../../../lib/boot');
var spawn  = require('child_process').spawn;

lingon.preProcessors.unshift('ejs', function(global, context) {
  return es.map(function(file, cb) {
      var ls = spawn('ls', [
        context.file
      ]);

      ls.stdout.on('data', function (data) {
        context.metadata = data.toString().trim();
      });

      ls.on('close', function (data) {
        cb(null, file);
      });
    });
});
