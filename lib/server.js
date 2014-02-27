var log = require('./utils/log');
var chalk = require('chalk');

var url = require('url');
var path = require('path');
var express = require('express');
var livereload = require('express-livereload');

function Server(OJ, ip, port) {
  var app = express();

  OJ.server = app;

  var requestHandler = function(request, response, next) {
    var path = url.parse(request.url);

    // Use index.html if no path was supplied
    if(path.href == '/') {
      path = url.parse('/index.html');
    }

    // Remove the slash
    path = path.pathname.substring(1);

    var requestPaths = [path];
    // Run OJ for the requested file
    OJ.run(requestPaths, function() {
      next();
    });
  };

  app.configure(function(){
    app.use(requestHandler);
    app.use(express.static(path.resolve(OJ.buildPath)));
  });

  app.listen(port, ip, function() {
    log('http server listening on: ' + ip + ':' + port);
  });

  livereload(app, {
    watchDir: process.cwd() + '/source',
    exts: ['less', 'ngt']
  })
}

module.exports = Server;