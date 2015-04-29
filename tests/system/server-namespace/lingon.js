#!/usr/bin/env node

var lingon = require('../../../lib/boot');

lingon.config.server.namespace = '/lingon';
lingon.config.server.catchAll = 'fallback.html';
lingon.config.server.directoryIndex = 'index.html';
