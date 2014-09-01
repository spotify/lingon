#!/usr/bin/env node

var lingon = require('../../../lib/boot');

lingon.global.name = "bob";

lingon.bind('serverConfigure', function() {
  lingon.global.name = "alice";
});
