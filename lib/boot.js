'use strict';

// This script parses arguments from the command line 
// and initiates Lingon. After the lingon.js file has been
// evaluated the build or server function will be executed.

var chalk = require('chalk');
var log = require('./utils/log');
var Lingon = require('./lingon');
var help = require('./utils/help');

var argv = require('minimist')(process.argv.slice(2));

var task = argv._[0];

var rootPath = process.cwd();

// Display version?
if(!!argv.v || task == 'version') {
  var pkg = require('../package.json');
  log('Local version:', pkg.version);
  
  if(!!global.lingonCliVersion) {
    log('Cli version: ', global.lingonCliVersion)
  }

  process.exit();
}

help.describe('version', {
  message: "Display Lingon version"
})

// Rewrite the help flag if given as a task (sugar syntax)
if(task == 'help') {
  task = null;
  argv.h = true;
}

// Setup the Lingon singleton instance
var lingon = new Lingon(task, rootPath);

lingon.defaultTask = 'server';

lingon.registerTask('server', function() {
  // Build once before starting the server
  lingon.build();

  var serverIp = argv.bind || '0.0.0.0';
  var serverPort = argv.p || '5678';
  var server = require('./server');
  server(lingon, serverIp, serverPort);
}, {
  message: "Start the HTTP server",
  arguments: {
    'p': "Run on custom port"
  }
});

// Start Lingon on the next pass on the event loop.
// This allows the ojfile to be evaluated in it's entirety
// before we run.

process.nextTick(function(){

  // Display help?
  if(!!argv.h) {
    help.show('lingon', task);
    process.exit();
  }

  log('Working directory:', chalk.magenta(rootPath));
  lingon.run();
});

// Pass through the lingon singleton to the ojfile
module.exports = lingon;
