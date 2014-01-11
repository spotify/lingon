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
var findup = require('findup-sync');

var OJ = require('./orangejuice');

var args = process.argv.slice(2);
var mode = args[0] || 'server';

var ojFile = require('fs').readFileSync('ojfile.js', 'utf8');

if (!ojFile) {
  gutil.log(gutil.colors.red('No ojfile found'));
  process.exit(1);
}

console.log("Orange Juice:", mode);

logEvents(gulp);

gulp.task('oj:server', function(){
  var port = 8080;
  var app = express();

  var gulpRequestHandler = function(request, response, next) {

    var url = request.url;

    gulp.run('oj:assets', function(err) {
      // TODO This callback is fired before the file has been written to disk
      // Fix and remove the timeout.
      console.log("Gulp is done");
      setTimeout(next, 100);
    });

  };

  app.configure(function(){
    app.use(gulpRequestHandler);
    app.use(express.static(path.resolve('./build/')));
  });
  
  app.listen(port, function() {
    gutil.log('Listening on', port);
  });
});

gulp.task('oj:build', function(){
  console.log('gulp: build');
  gulp.run('oj:assets', function(err) {
    if(err) console.log(err);
  });
});



var localBaseDir = process.cwd();
var ojFile = getOjFile(localBaseDir);

// Start the default task (server) or build
loadOjFile(gulp, ojFile, ["oj:" + mode])


function loadOjFile(gulp, ojFile, tasks){
  var ojFileCwd = path.dirname(ojFile);
  process.chdir(ojFileCwd);
  gutil.log('Working directory changed to', gutil.colors.magenta(ojFileCwd));

  OJ.setup(gulp, mode);

  var theGulpfile = require(ojFile);
  
  // just for good measure
  process.nextTick(function(){
    gulp.run.apply(gulp, tasks);
  });
  return theGulpfile;
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