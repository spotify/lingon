#!/usr/bin/env node

'use strict';

var es = require('event-stream');
var lingon = require('../../../lib/boot');
var spawn  = require('child_process').spawn;

lingon.preProcessors.unshift('ejs', function(params) {
  return es.map(function(file, cb) {
      var ls = spawn('ls', [
        params.context.file
      ]);

      ls.stdout.on('data', function(data) {
        params.context.metadata = data.toString().trim();
      });

      ls.on('close', function(data) {
        cb(null, file);
      });
    });
});
