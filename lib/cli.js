#! /usr/bin/env node

/*
 * orangejuice
 * https://github.com/jpettersson/orangejuice
 *
 * Copyright (c) 2014 Jonathan Pettersson
 * Licensed under the MIT license.
 */

'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var prettyTime = require('pretty-hrtime');
var express = require('express');
var path = require('path');
var resolve = require('resolve');
var findup = require('findup-sync');

var argv = require('optimist').argv;
var mode = argv._[0] || 'server';

var localBaseDir = process.cwd();

var ojFile = getOjFile(localBaseDir);

var cliPkg = require('../package.json');

// find the local orangejuice
var OJ = findLocalOrangejuice(ojFile);
var localPkg = findLocalOrangejuicePackage(ojFile);

// print some versions and shit
if (argv.v || argv.version) {
  console.log('OJ: CLI version', cliPkg.version);
  if (OJ) {
    console.log('OJ: Local version', localPkg.version);
  }
  process.exit(0);
}

if (!OJ) {
  gutil.log(gutil.colors.red('No local Orangejuice install found in'), getLocalBase(ojFile));
  gutil.log(gutil.colors.red('Perhaps do: npm install orangejuice'));
  process.exit(1);
}

if (!ojFile) {
  gutil.log(gutil.colors.red('No ojfile found'));
  process.exit(1);
}

logEvents(gulp);

var localBaseDir = process.cwd();
var ojFile = getOjFile(localBaseDir);

// Start the default task (server) or build
loadOjFile(gulp, ojFile, ["oj:" + mode])


// Utility functions

function loadOjFile(gulp, ojFile, tasks){
  var ojFileCwd = path.dirname(ojFile);
  process.chdir(ojFileCwd);
  console.log("[ " + gutil.colors.yellow('OJ') + " ]", 'Working directory:', gutil.colors.magenta(ojFileCwd));

  OJ.setup(gulp, mode, ojFileCwd);
  
  //Evaluate the ojFile
  require(ojFile);
  
  // just for good measure
  process.nextTick(function(){

    if(mode == 'server') {
      var port = 8080;
      var app = express();

      var ojRequestHandler = function(request, response, next) {

        var url = request.url;

        OJ.run(function() {
          next();
        });

      };

      app.configure(function(){
        app.use(ojRequestHandler);
        app.use(express.static(path.resolve('./build/')));
      });
      
      app.listen(port, function() {
        console.log("[ " + gutil.colors.yellow('OJ') + " ]", 'Listening on', port);

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

function findLocalOrangejuice(ojFile){
  var baseDir = getLocalBase(ojFile);
  return findLocalModule('orangejuice', baseDir);
}

function findLocalModule(modName, baseDir){
  try {
    console.log(resolve.sync(modName, {basedir: baseDir}))
    return require(resolve.sync(modName, {basedir: baseDir}));
  } catch(e) {
    console.log(e);
  }
  return;
}

function findLocalOrangejuicePackage(ojFile){
  var baseDir = getLocalBase(ojFile);
  var packageBase;
  try {
    packageBase = path.dirname(resolve.sync('orangejuice', {basedir: baseDir}));
    return require(path.join(packageBase, '../package.json'));
  } catch(e) {
    console.log(e);
  }
  return;
}

// format orchestrator errors
function formatError (e) {
  if (!e.err) return e.message;
  if (e.err.message) return e.err.message;
  return JSON.stringify(e.err);
}

// wire up logging events
function logEvents(gulp) {
  gulp.on('task_start', function(e){
    gutil.log('Running', "'"+gutil.colors.cyan(e.task)+"'...");
  });

  gulp.on('task_stop', function(e){
    var time = prettyTime(e.hrDuration);
    gutil.log('Finished', "'"+gutil.colors.cyan(e.task)+"'", 'in', gutil.colors.magenta(time));
  });

  gulp.on('task_err', function(e){
    var msg = formatError(e);
    var time = prettyTime(e.hrDuration);
    gutil.log('Errored', "'"+gutil.colors.cyan(e.task)+"'", 'in', gutil.colors.magenta(time), gutil.colors.red(msg));
  });

  gulp.on('task_not_found', function(err){
    gutil.log(gutil.colors.red("Task '"+err.task+"' was not defined in your gulpfile but you tried to run it."));
    gutil.log('Please check the documentation for proper gulpfile formatting.');
    process.exit(1);
  });
}