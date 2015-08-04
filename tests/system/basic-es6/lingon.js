#!/usr/bin/env node

'use strict';

var lingon = require('../../../lib/boot');
var Builder = require('systemjs-builder');
var es = require('event-stream');

lingon.preProcessors.push('js', function(params) {
  var builder = new Builder(lingon.config.rootPath, {
    defaultJSExtensions : true,

    // opt in to Babel for transpiling over Traceur
    transpiler          : 'babel'
  });

  return es.map(function(file, cb) {
    builder.buildSFX(
      params.context.file, {runtime: false}
    )
    .then(function(output) {
      file.contents = new Buffer(output.source);
      cb(null, file);
    })
    .catch(function(err) {
      cb(err);
    });
  });
});
