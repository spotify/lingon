#!/usr/bin/env node

var es = require('event-stream');
var oj = require('../../lib/boot');

var createProcessor = function(type) {
  return es.map(function(file, cb) {
    var contents = file.contents.toString('utf8');

    contents += type + 'processor has been executed' + "\r\n";

    file.contents = new Buffer(contents);
    cb(null, file);
  });
};

oj.preProcessor('simplesyntax', function(params) {
  return createProcessor('simple pre');
});

oj.preProcessor('alternativesyntax', function(params) {
  return [
    createProcessor('alternative pre')
  ];
});

oj.preProcessor('multiplesyntax', function(params) {
  return [
    createProcessor('multiple1 pre'),
    createProcessor('multiple2 pre')
  ];
});



oj.postProcessors.set('simplesyntax', function(params) {
  return createProcessor('simple postprocessor that will be overwritten ');
});
oj.postProcessors.set('simplesyntax', function(params) {
  return createProcessor('simple post');
});
oj.postProcessors.add('simplesyntax', /matching/, function(params) {
  return createProcessor('simple path-matching post');
});

oj.postProcessors.add('alternativesyntax', function(params) {
  return [
    createProcessor('alternative post')
  ];
});

oj.postProcessors.add('multiplesyntax', function(params) {
  return createProcessor('multiple1 post');
});
oj.postProcessors.add('multiplesyntax', function(params) {
  return [
    createProcessor('multiple2 post'),
    createProcessor('multiple3 post')
  ];
});
