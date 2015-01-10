var rimraf      = require('rimraf');
var path        = require('path');

module.exports = function(lingon) {
  lingon.registerTask('clean', function(callback) {
    rimraf(path.join(lingon.rootPath, lingon.config.buildPath), function(error) {
      if (!error) {
        lingon.log.info('[Info] The ' + lingon.config.buildPath + ' folder has been cleaned');
      } else {
        console.error('[ ' + chalk.red('Lingon') + ' ] ' + chalk.yellow('[Error] The ' + lingon.config.buildPath + ' folder could not be cleaned'));
      }

      callback();
    }.bind(this));
  }, {
    message: 'Clean the ' + lingon.config.buildPath + ' folder',
    arguments: {}
  });
};

