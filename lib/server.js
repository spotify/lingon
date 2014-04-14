var log = require('./utils/log');
var chalk = require('chalk');

var url = require('url');
var path = require('path');
var express = require('express');

function Server(lingon, ip, port) {
  var app = express();

  lingon.server = app;

  var requestHandler = function(request, response, next) {
    var path = url.parse(request.url);

    // Use index.html if no path was supplied
    if(path.href == '/') {
      path = url.parse('/index.html');
    }

    // Remove the slash
    path = path.pathname.substring(1);

    var requestPaths = [path];

    // Run lingon for the requested file
    lingon.build(requestPaths, function(requestFiles) {
      if(!requestFiles || !requestFiles[0]) { return next(); }

      var file = requestFiles[0];

      response.type( express.mime.lookup(file.path) );
      response.body = file.contents; // save output file contents

      next(); // allow other middleware to run, e.g. in plugins
    });
  };

  var responseHandler = function(request, response, next) {
    response.send(response.body); // send response to browser
  }

  OJ.one('beforeFirstRun', function() {
    app.use(responseHandler); // register this middleware after plugins have registered theirs
  })

  app.configure(function(){
    app.use(requestHandler);
  });

  app.listen(port, ip, function() {
    log('http server listening on: ' + ip + ':' + port);
    lingon.trigger('serverStarted');
  });
}

module.exports = Server;