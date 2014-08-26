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
lingon.preProcessor.set('simplesyntax', function(params) {
  return createProcessor('simple preprocessor that will be overwritten ');
});
lingon.preProcessor.set('simplesyntax', function(params) {
  return createProcessor('simple pre');
});

lingon.preProcessor.push('alternativesyntax', function(params) {
  return [
    createProcessor('alternative pre')
  ];
});

lingon.preProcessor.push('multiplesyntax', function(params) {
  return [
    createProcessor('multiple1 pre'),
    createProcessor('multiple2 pre')
  ];
});

lingon.preProcessor.push('orderedsyntax', function(params) {
  return createProcessor('ordered and to be removed pre');
});
lingon.preProcessor.remove('orderedsyntax');
lingon.preProcessor.push('orderedsyntax', function(params) {
  return createProcessor('ordered pre');
});
var orderedsyntaxPreFunction = function(params) {
  return createProcessor('ordered and to be removed by orderedsyntaxPreFunction  pre');
}
lingon.preProcessor.push('orderedsyntax', orderedsyntaxPreFunction);
lingon.preProcessor.remove('orderedsyntax', orderedsyntaxPreFunction);




// post processors
lingon.postProcessor.push(['simplesyntax', 'simplealias'], function(params) {
  return createProcessor('simple postprocessor that will be overwritten ');
});
lingon.postProcessor.set(['simplesyntax', 'simplealias'], function(params) {
  return createProcessor('simple post');
});
lingon.postProcessor.push(['simplesyntax', 'simplealias'], /matching/, function(params) {
  return createProcessor('simple path-matching post');
});
lingon.postProcessor.push(['simplesyntax', 'simplealias'], /matching-again/, function(params) {
  return createProcessor('simple path-matching and to be removed post');
});
lingon.postProcessor.remove(['simplesyntax', 'simplealias'], /matching-again/);

var simplesyntaxPostFunction = function(params) {
  return createProcessor('simple path-matching and to be removed by simplesyntaxPostFunction post');
};
lingon.postProcessor.push(['simplesyntax', 'simplealias'], /matching-again/, simplesyntaxPostFunction);
lingon.postProcessor.remove(['simplesyntax', 'simplealias'], /matching-again/, simplesyntaxPostFunction);


lingon.postProcessor.push(['alternativesyntax'], function(params) {
  return [
    createProcessor('alternative post')
  ];
});

lingon.postProcessor.push(['multiplesyntax'], function(params) {
  return createProcessor('multiple1 post');
});
lingon.postProcessor.push(['multiplesyntax'], function(params) {
  return [
    createProcessor('multiple2 post'),
    createProcessor('multiple3 post')
  ];
});

lingon.postProcessor.push(['orderedsyntax'], function(params) {
  return createProcessor('ordered1 post');
});
lingon.postProcessor.unshift(['orderedsyntax'], function(params) {
  return createProcessor('ordered2 post');
});
lingon.postProcessor.push(['orderedsyntax'], function(params) {
  return [
    createProcessor('ordered3 post'),
    createProcessor('ordered4 post')
  ];
});
