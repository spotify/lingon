var chalk = require('chalk');

module.exports = function() {
  console.log.apply(null, ["[ " + chalk.yellow('OJ') + " ]"].concat(
    Array.prototype.slice.call(arguments, 0)
  ));
}