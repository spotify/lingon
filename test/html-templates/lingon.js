#!/usr/bin/env node

var lingon = require('../../lib/boot');
var ngHtml2js = require('lingon-ng-html2js');

lingon.preProcessor('ngt', function() {
  return ngHtml2js({
    moduleName: 'templates',
    base: 'source'
  });
});
