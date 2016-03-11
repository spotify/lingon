'use strict';

var url               = require('url');
var express           = require('express');
var chalk             = require('chalk');
var log               = require('../utils/log');
var buildCallback     = require('./buildCallback');

var server = function (lingon, ip, port, requestHandler) {
  var app = express();

  lingon.server = app;

  var catchAllHandler = function (request, response, next) {
    if (!response.body && lingon.config.server.catchAll) {
      lingon.build({
        callback: buildCallback(request, response, next),
        requestPath: lingon.config.server.catchAll,
        pipelineTerminators: [],
      });
    } else {
      next();
    }
  };

  var responseHandler = function (request, response, next) {
    if (response.body) {
      return response.send(response.body);
    }

    response.status(404).send('File not found');
  };

  app.use(lingon.config.server.namespace, requestHandler);

  lingon.trigger('serverConfigure');
  app.use(catchAllHandler);
  app.use(responseHandler);

  process.on('uncaughtException', function (error) {
    if (error.code == 'EADDRINUSE') {
      log.error('A port is already in use, lingon could not start properly!');
      log.info('[Info] Try starting lingon with a different port (' +
          chalk.blue('lingon server -p <PORT>') +
          ') or check your plugin configurations.');
    } else {
      log.error(error.message);
    }
  });

  app.listen(port, ip, function () {
    var hostname = ip == '0.0.0.0' ? 'localhost' : ip; // chrome started disallowing 0.0.0.0 in the browser URL
    log.info('http server listening on: http://' + hostname + ':' + port +
        lingon.config.server.namespace);
    lingon.trigger('serverStarted');
  });

};

module.exports = server;
