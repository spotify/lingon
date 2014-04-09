'use strict';

// This script parses arguments from the command line 
// and initiates Lingon. After the lingon.js file has been
// evaluated the build or server function will be executed.

var chalk = require('chalk');
var log = require('./utils/log');
var Lingon = require('./lingon');

var argv = require('optimist').argv;

var task = argv._[0] || 'server';

var rootPath = process.cwd();

log('Working directory:', chalk.magenta(rootPath));

// Setup the Lingon singleton instance
var lingon = new Lingon(task, rootPath);

lingon.registerTask('server', function() {
  // Build once before starting the server
  lingon.build();

  var serverIp = argv.bind || '0.0.0.0';
  var serverPort = argv.p || '5678';
  var server = require('./server');
  server(lingon, serverIp, serverPort);
});

// Start Lingon on the next pass on the event loop.
// This allows the ojfile to be evaluated in it's entirety
// before we run.

process.nextTick(function(){
  lingon.run();
});

// Pass through the lingon singleton to the ojfile
module.exports = lingon;
