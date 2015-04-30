#!/usr/bin/env node

'use strict';

var es = require('event-stream');
var lingon = require('../../../lib/boot');

// pre processors
lingon.preProcessors.set('module', function(params) {
  return es.map(function(file, cb) {
    // var contents = file.contents.toString('utf8');

    var top = '(function(){\n';
    var bottom = '\n})();';

    file.contents = new Buffer(top + file.contents.toString() + bottom);

    cb(null, file);
  });
});
