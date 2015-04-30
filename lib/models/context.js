'use strict';

var Context = function(params) {
  this.file = params.file || null;
  this.template = params.template || null;
  this.layout = params.layout || null;
};

module.exports = Context;
