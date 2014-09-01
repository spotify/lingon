#!/usr/bin/env node

var es = require('event-stream');
var lingon = require('../../../lib/boot');
var spawn  = require('child_process').spawn;

lingon.preProcessors.unshift('ejs', function(global, context) {
  return es.map(function(file, cb) {
      var shasum = spawn('shasum', [
        context.file
      ]);

      shasum.stdout.on('data', function (data) {
        context.metadata = data.toString().trim();
      });

      shasum.on('close', function (data) {
        cb(null, file);
      });
    });
});
