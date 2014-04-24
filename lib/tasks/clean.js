var rimraf      = require('rimraf');
var path        = require('path');

module.exports = function(lingon) {
  lingon.registerTask('clean', function(callback) {
    rimraf(path.join(lingon.rootPath, lingon.buildPath), function(error) {
      if (!error) {
        lingon.log('[Info] The ' + lingon.buildPath + ' folder has been cleaned');
      } else {
        lingon.log(chalk.yellow('[Error] The ' + lingon.buildPath + ' folder could not be cleaned'));
      }

      callback();
    }.bind(this));
  }, {
    message: 'Clean the ' + lingon.buildPath + ' folder',
    arguments: {}
  });
};

