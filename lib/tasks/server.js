'use strict';

var server = require('../server/server');
var dynamicRequestHandlerFactory = require('../server/dynamicRequestHandler');

module.exports = function (lingon) {

  lingon.registerTask('server', function (callback) {
    var serverIp = lingon.argv.bind || '0.0.0.0';
    var serverPort = lingon.argv.p || '5678';

    var dynamicRequestHandler = dynamicRequestHandlerFactory(lingon, serverIp, serverPort);
    server(lingon, serverIp, serverPort, dynamicRequestHandler);
  }, {

    message: 'Start the HTTP server',
    arguments: {
      p: 'Run on custom port',
    },
  });
};
