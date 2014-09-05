#!/usr/bin/env node

var lingon = require('../../../lib/boot');

lingon.config.server.catchAll = 'error404.html';
