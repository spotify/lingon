#!/usr/bin/env node

var lingon = require('../../lib/boot');

lingon.context.name = "bob";

lingon.bind('serverConfigure', function() {
  lingon.context.name = "alice";
});
