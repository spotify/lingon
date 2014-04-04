var log = require('./utils/log');
var chalk = require('chalk');

var url = require('url');
var path = require('path');
var express = require('express');

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
    OJ.build(requestPaths, function(requestFiles) {
      if(!requestFiles || !requestFiles[0]) { return next(); }

      var file = requestFiles[0];

      response.type( express.mime.lookup(file.path) );
      response.send( file.contents );
    });
  };

  app.configure(function(){
    app.use(requestHandler);
  });

  app.listen(port, ip, function() {
    log('http server listening on: ' + ip + ':' + port);
    OJ.trigger('serverStarted');
  });
}

module.exports = Server;