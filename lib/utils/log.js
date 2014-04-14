var chalk = require('chalk');

module.exports = function() {
  console.log.apply(null, ["[ " + chalk.red('Lingon') + " ]"].concat(
    Array.prototype.slice.call(arguments, 0)
  ));
}