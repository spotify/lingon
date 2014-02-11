'use strict';

// This script parses arguments from the command line 
// and initiates Orangejuice. After the ojfile has been
// evaluated the build or server function will be executed.

var chalk = require('chalk');
var log = require('./utils/log');
var orangejuice = require('./orangejuice');

var argv = require('optimist').argv;
var mode = argv._[0] || 'server';

var rootPath = process.cwd();

log('Working directory:', chalk.magenta(rootPath));

// Setup the OJ singleton instance
var OJ = new orangejuice(mode, rootPath);

// Start Orangejuice on the next pass on the event loop.
// This allows the ojfile to be evaluated in it's entirety
// before we run.
process.nextTick(function(){
  if(mode == 'server') {
    var serverIp = argv.bind || '0.0.0.0';
    var serverPort = argv.p || '5678';
    var server = require('./server');
    server(OJ, serverIp, serverPort);
  }else{
    OJ.run();
  }
});

// Pass through the OJ singleton to the ojfile
module.exports = OJ;
