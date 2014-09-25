#!/usr/bin/env node

var lingon = require('../../../lib/boot');

lingon.config.server.catchAll = 'index.html';
lingon.config.server.directoryIndex = 'default.html';
