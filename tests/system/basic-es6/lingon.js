#!/usr/bin/env node

'use strict';

var path = require('path');
var LingonClass = require('../../../lib/lingon');
var lingon = require('../../../lib/boot');
var Builder = require('systemjs-builder');
var es = require('event-stream');

var builder = new Builder(lingon.rootPath, {
  defaultJSExtensions : true,

  // opt in to Babel for transpiling over Traceur
  transpiler          : 'babel',
});

lingon.postProcessors.push('js', function() {
  return es.map(function(file, cb) {
    var filePath = path.join(lingon.config.sourcePath,
        path.relative(file.base, file.path));

    builder.buildStatic(filePath, {runtime: true})
      .then(function(output) {
        file.contents = new Buffer(output.source);
        cb(null, file);
      })
      .catch(function(err) {
        cb(err);
      });
  });
});

lingon.postProcessors.push(['js', 'css', 'less'], function() {
  let year = (new Date()).getFullYear();

  return es.map(function(file, cb) {
    let header = '/*!\n* Copyright (c) ' + year + ' Spotify AB\n*/\n';
    file.contents = new Buffer(header + file.contents.toString());

    cb(null, file);
  });
});
