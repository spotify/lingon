var url     = require('url');
var express = require('express');
var log     = require('./utils/log');
var Builder = require('./builder');

var server = function(lingon, ip, port) {
  var app = express();

  lingon.server = app;

  var buildCallback = function(request, response, next) {
    return function(requestFiles) {
      if(!requestFiles || !requestFiles[0]) { return next(); }

      var file = requestFiles[0];

      response.type( express.mime.lookup(file.path) );
      response.body = file.contents;

      next();
    };
  };

  var requestHandler = function(request, response, next) {
    var path = url.parse(request.url);

    // Serve directoryIndex if path ends with a slash (directory)
    if(path.href.substr(-1, 1) === '/') {
      path = url.parse(path.href + lingon.config.server.directoryIndex);
    }

    // Remove the slash
    path = path.pathname.substring(1);

    var requestPaths = [path];

    // Run lingon for the requested file
    lingon.build({
      'callback': buildCallback(request, response, next), 
      'requestPaths': requestPaths//,
      // Insert callback function here as a pipelineTerminator!
    });
  };

  var catchAllHandler = function(request, response, next) {
    if(!response.body && lingon.config.server.catchAll) {
      lingon.build({
        'callback': buildCallback(request, response, next), 
        'requestPaths': [lingon.config.server.catchAll]
      });
    } else {
      next();
    }
  };

  var responseHandler = function(request, response, next) {
    if(response.body) {
      return response.send(response.body);
    }

    response.send(404, 'File not found');
  };

  app.use(lingon.config.server.namespace, requestHandler);
  lingon.trigger('serverConfigure');
  app.use(catchAllHandler);
  app.use(responseHandler);

  app.listen(port, ip, function() {
    log('http server listening on: ' + ip + ':' + port);
    lingon.trigger('serverStarted');
  });
};

module.exports = server;
