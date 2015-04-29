#!/usr/bin/env node

'use strict';

var es = require('event-stream');
var lingon = require('../../../lib/boot');

var createProcessor = function(type) {
  return es.map(function(file, cb) {
    var contents = file.contents.toString('utf8');

    contents += type + 'processor has been executed' + '\n';

    file.contents = new Buffer(contents);
    cb(null, file);
  });
};

//
//
//
// pre processors
lingon.preProcessors.set('simplesyntax', function(params) {
  return createProcessor('simple preprocessors that will be overwritten ');
});
lingon.preProcessors.set('simplesyntax', function(params) {
  return createProcessor('simple pre');
});

lingon.preProcessors.push('alternativesyntax', function(params) {
  return [
    createProcessor('alternative pre')
  ];
});

lingon.preProcessors.push('multiplesyntax', function(params) {
  return [
    createProcessor('multiple1 pre'),
    createProcessor('multiple2 pre')
  ];
});

lingon.preProcessors.push('orderedsyntax', function(params) {
  return createProcessor('ordered and to be removed pre');
});
lingon.preProcessors.remove('orderedsyntax');
lingon.preProcessors.push('orderedsyntax', function(params) {
  return createProcessor('ordered pre');
});
var orderedsyntaxPreFunction = function(params) {
  return createProcessor(
    'ordered and to be removed by orderedsyntaxPreFunction  pre'
    );
};
lingon.preProcessors.push('orderedsyntax', orderedsyntaxPreFunction);
lingon.preProcessors.remove('orderedsyntax', orderedsyntaxPreFunction);

//
//
//
// post processors
lingon.postProcessors.push(['simplesyntax', 'simplealias'], function(params) {
  return createProcessor('simple postprocessors that will be overwritten ');
});
lingon.postProcessors.set(['simplesyntax', 'simplealias'], function(params) {
  return createProcessor('simple post');
});
lingon.postProcessors.push(['simplesyntax', 'simplealias'], /matching/, function(params) {
  return createProcessor('simple path-matching post');
});
lingon.postProcessors.push(['simplesyntax', 'simplealias'], /matching-again/, function(params) {
  return createProcessor('simple path-matching and to be removed post');
});
lingon.postProcessors.remove(['simplesyntax', 'simplealias'], /matching-again/);

var simplesyntaxPostFunction = function(params) {
  return createProcessor('simple path-matching and to be removed by simplesyntaxPostFunction post');
};
lingon.postProcessors.push(
  ['simplesyntax', 'simplealias'], /matching-again/, simplesyntaxPostFunction
);
lingon.postProcessors.remove(
  ['simplesyntax', 'simplealias'], /matching-again/, simplesyntaxPostFunction
);

lingon.postProcessors.push(['alternativesyntax'], function(params) {
  return [
    createProcessor('alternative post')
  ];
});

lingon.postProcessors.push(['multiplesyntax'], function(params) {
  return createProcessor('multiple1 post');
});
lingon.postProcessors.push(['multiplesyntax'], function(params) {
  return [
    createProcessor('multiple2 post'),
    createProcessor('multiple3 post')
  ];
});

lingon.postProcessors.push(['orderedsyntax'], function(params) {
  return createProcessor('ordered1 post');
});
lingon.postProcessors.unshift(['orderedsyntax'], function(params) {
  return createProcessor('ordered2 post');
});
lingon.postProcessors.push(['orderedsyntax'], function(params) {
  return [
    createProcessor('ordered3 post'),
    createProcessor('ordered4 post')
  ];
});
