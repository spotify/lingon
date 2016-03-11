'use strict';

var server = require('../server');

module.exports = function (lingon) {
  lingon.registerTask('static', function (callback) {
    var serverIp = lingon.argv.bind || '0.0.0.0';
    var serverPort = lingon.argv.p || '5678';
    server(lingon, serverIp, serverPort, true);
  }, {

    message: 'Build once and serve static files',
    arguments: {
      p: 'Run on custom port',
    },
  });
};
