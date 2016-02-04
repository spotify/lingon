'use strict';

var chalk = require('chalk');

function Logger() {

}

Logger.prototype.info = function () {
  console.log.apply(null, ['[ ' + chalk.red('Lingon') + ' ]'].concat(
    Array.prototype.slice.call(arguments, 0)
  ));
};

Logger.prototype.error = function () {
  console.error.apply(null, ['[ ' + chalk.red('Lingon') + ' ]'].concat(
    chalk.yellow('[Error] ' + Array.prototype.slice.call(arguments, 0))
  ));
};

module.exports = new Logger();
