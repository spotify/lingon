'use strict';

var findup = require('findup-sync');
var path = require('path');
var gutil = require('gulp-util');
var express = require('express');

var OJ = require('./orangejuice');

var argv = require('optimist').argv;
var mode = argv._[0] || 'server';
var serverPort = argv.p || '5678'

var localBaseDir = process.cwd();
var ojFile = getOjFile(localBaseDir);

if (!ojFile) {
  gutil.log(gutil.colors.red('No ojfile found'));
  process.exit(1);
}

loadOjFile(ojFile, ["oj:" + mode])

// Utility functions

function loadOjFile(ojFile, tasks){
  var ojFileCwd = path.dirname(ojFile);
  process.chdir(ojFileCwd);
  console.log("[ " + gutil.colors.yellow('OJ') + " ]", 'Working directory:', gutil.colors.magenta(ojFileCwd));

  OJ.setup(mode, ojFileCwd);

  //Evaluate the ojFile
  require(ojFile);

  // just for good measure
  process.nextTick(function(){

    if(mode == 'server') {
      var app = express();

      // Run once to ensure clean first build
      OJ.run();

      var ojRequestHandler = function(request, response, next) {

        var url = request.url;

        OJ.run([url.substring(1)], function() {
          next();
        });

      };

      app.configure(function(){
        app.use(ojRequestHandler);
        app.use(express.static(path.resolve(OJ.buildPath)));
      });

      app.listen(serverPort, function() {
        console.log("[ " + gutil.colors.yellow('OJ') + " ]", 'http server listening on http://0.0.0.0:' + serverPort);

      });
    }else{
      OJ.run();
    }

  });
}

function getOjFile(baseDir) {
  var extensions;
  if (require.extensions) {
    extensions = Object.keys(require.extensions).join(',');
  } else {
    extensions = ['.js'];
  }
  var ojFile = findup('ojfile{'+extensions+'}', {nocase: true});
  return ojFile;
}

function getLocalBase(ojFile) {
  return path.resolve(path.dirname(ojFile));
}

module.exports = OJ;
