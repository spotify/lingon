'use strict';

// This script parses arguments from the command line
// and initiates Lingon. After the lingon.js file has been
// evaluated the build or server function will be executed.

var chalk  = require('chalk');
var log    = require('./utils/log');
var help   = require('./utils/help');
var Lingon = require('./lingon');

var argv = require('minimist')(process.argv.slice(2));

var tasks = argv._;

var rootPath = process.cwd();

// Display version?
if(!!argv.v || tasks[0] === 'version') {
  var pkg = require('../package.json');
  log('Lingon version:', pkg.version);
  process.exit();
}

// Rewrite the help flag if given as a task (sugar syntax)
if(!!argv.h && tasks.indexOf('help') < 0) {
  argv._.unshift('help');
}

// Setup the Lingon singleton instance
var lingon = new Lingon(rootPath, argv);

// Start Lingon on the next pass on the event loop.
// This allows the lingon file to be evaluated in it's entirety
// before we run.

process.nextTick(function() {

  // Display help?
  if(tasks[0] === 'help') {
    if(tasks.length > 1) {
      help.show('lingon', tasks[1]);
    } else {
      help.show('lingon');
    }
    process.exit();
  }

  // if no tasks have been supplied use the default one
  tasks = tasks.length > 0 ? tasks : [lingon.config.defaultTask];

  log('Working directory:', chalk.magenta(rootPath));
  lingon.run(tasks);
});

// Pass through the lingon singleton to the lingon file
module.exports = lingon;
