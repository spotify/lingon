'use strict';

// This script parses arguments from the command line
// and initiates Lingon. After the lingon.js file has been
// evaluated the build or server function will be executed.

var chalk  = require('chalk');
var log    = require('./utils/log');
var Lingon = require('./lingon');
var help   = require('./utils/help');

var argv = require('minimist')(process.argv.slice(2));

var tasks = argv._;

var rootPath = process.cwd();

// Display version?
if(!!argv.v || tasks[0] === 'version') {
  var pkg = require('../package.json');
  log('Lingon version:', pkg.version);
  process.exit();
}

help.describe('version', {
  message: 'Display Lingon version'
});

// Rewrite the help flag if given as a task (sugar syntax)
if(tasks[0] === 'help') {
  argv.h = true;
}

// Setup the Lingon singleton instance
var lingon = new Lingon(rootPath);

lingon.defaultTask = 'server';
lingon.registerTask('server', function(callback) {
  // Build once before starting the server
  lingon.build(function() {
    var serverIp = argv.bind || '0.0.0.0';
    var serverPort = argv.p || '5678';
    var server = require('./server');
    server(lingon, serverIp, serverPort);
  });
}, {
  message: 'Start the HTTP server',
  arguments: {
    'p': 'Run on custom port'
  }
});

// Start Lingon on the next pass on the event loop.
// This allows the ojfile to be evaluated in it's entirety
// before we run.

process.nextTick(function(){

  // Display help?
  if(!!argv.h) {
    if(tasks.length > 1) {
      help.show('lingon', tasks[1]);
    } else {
      help.show('lingon');
    }
    process.exit();
  }

  // if no tasks have been supplied use the default one
  tasks = tasks.length > 0 ? tasks : [lingon.defaultTask];

  log('Working directory:', chalk.magenta(rootPath));
  lingon.run(tasks);
});

// Pass through the lingon singleton to the ojfile
module.exports = lingon;
