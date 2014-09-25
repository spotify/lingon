#!/usr/bin/env node

var lingon = require('../../../lib/boot');

lingon.config.server.catchAll = 'catch-all.html';
lingon.config.server.directoryIndex = 'default.html';
