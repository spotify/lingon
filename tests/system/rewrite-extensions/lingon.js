#!/usr/bin/env node

var lingon = require('../../../lib/boot');
var es = require('event-stream');

var createProcessor = function(type) {
  return es.map(function(file, cb) {
    var contents = file.contents.toString('utf8');

    contents += type + 'processor has been executed' + '\n';

    file.contents = new Buffer(contents);
    cb(null, file);
  });
};

lingon.preProcessors.push('ngt', function(params) {
  return createProcessor('simple preprocessor that will be overwritten ');
});

lingon.rewriteExtension('boo', 'foo');

lingon.preProcessors.push('boo', function(params) {
  return createProcessor('simple preprocessor that will be overwritten ');
});

lingon.rewriteExtension('normal', 'rewritten');
lingon.clearExtensionRewrite('normal');
