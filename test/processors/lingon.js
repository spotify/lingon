#!/usr/bin/env node

var es = require('event-stream');
var lingon = require('../../lib/boot');

var createProcessor = function(type) {
  return es.map(function(file, cb) {
    var contents = file.contents.toString('utf8');

    contents += type + 'processor has been executed' + "\n";

    file.contents = new Buffer(contents);
    cb(null, file);
  });
};

// pre processors
lingon.preProcessor('simplesyntax', function(params) {
  return createProcessor('simple preprocessor that will be overwritten ');
});
lingon.preProcessor('simplesyntax', function(params) {
  return createProcessor('simple pre');
});

lingon.preProcessor('alternativesyntax', function(params) {
  return [
    createProcessor('alternative pre')
  ];
});

lingon.preProcessor('multiplesyntax', function(params) {
  return [
    createProcessor('multiple1 pre'),
    createProcessor('multiple2 pre')
  ];
});

lingon.preProcessor('orderedsyntax', function(params) {
  return createProcessor('ordered pre');
});



// post processors
lingon.postProcessor('simplesyntax').set(function(params) {
  return createProcessor('simple postprocessor that will be overwritten ');
});
lingon.postProcessor('simplesyntax').set(function(params) {
  return createProcessor('simple post');
});
lingon.postProcessor('simplesyntax').add(/matching/, function(params) {
  return createProcessor('simple path-matching post');
});

lingon.postProcessor('alternativesyntax').add(function(params) {
  return [
    createProcessor('alternative post')
  ];
});

lingon.postProcessor('multiplesyntax').add(function(params) {
  return createProcessor('multiple1 post');
});
lingon.postProcessor('multiplesyntax').add(function(params) {
  return [
    createProcessor('multiple2 post'),
    createProcessor('multiple3 post')
  ];
});

lingon.postProcessor('orderedsyntax').push(function(params) {
  return createProcessor('ordered1 post');
});
lingon.postProcessor('orderedsyntax').unshift(function(params) {
  return createProcessor('ordered2 post');
});
lingon.postProcessor('orderedsyntax').add(function(params) {
  return [
    createProcessor('ordered3 post'),
    createProcessor('ordered4 post')
  ];
});
