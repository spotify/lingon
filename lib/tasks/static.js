'use strict';

var server = require('../server/server');
var express = require('express');

module.exports = function (lingon) {

  var staticRequestHandler = express.static(lingon.config.buildPath);

  function startServer() {
    var serverIp = lingon.argv.bind || '0.0.0.0';
    var serverPort = lingon.argv.p || '5678';
    server(lingon, serverIp, serverPort, staticRequestHandler);
  }

  lingon.registerTask('static-server', function (callback) {
    lingon.build({
      callback: startServer,
    });
  },

  {
    message: 'Build once and serve static files',
    arguments: {
      p: 'Run on custom port',
    },
  });
};
