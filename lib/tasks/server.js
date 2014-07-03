var server = require('../server');

module.exports = function(lingon) {
  lingon.registerTask('server', function(callback) {

    var serverIp = lingon.argv.bind || '0.0.0.0';
    var serverPort = lingon.argv.p || '5678';
    server(lingon, serverIp, serverPort);
  }, {
    message: 'Start the HTTP server',
    arguments: {
      'p': 'Run on custom port'
    }
  });
};