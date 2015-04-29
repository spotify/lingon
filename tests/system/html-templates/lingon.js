#!/usr/bin/env node

'use strict';

var lingon    = require('../../../lib/boot');
var ngHtml2js = require('lingon-ng-html2js');

lingon.preProcessors.push('ngt', function() {
  return ngHtml2js({
    moduleName: 'templates',
    base: 'source'
  });
});
