var crypto = require('crypto');

module.exports = function(body) {
  var hash = crypto.createHash('sha1');
  hash.setEncoding('hex');
  hash.write(body);
  hash.end();

  return hash.read();
};
