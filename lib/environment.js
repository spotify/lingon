var hike            = require('hike');
var fs              = require('fs');
var path            = require('path');

var ENV = function(opts) {
  this.rootPath = opts.rootPath || '.';
  this.sourcePath = opts.sourcePath || 'source';
  this.ignorePrefixPattern = opts.ignorePrefixPattern || new RegExp('\/_');

  this.trail = new hike.Trail(this.rootPath);
  this.trail.paths.append(this.sourcePath);
};

ENV.prototype.getSourceFiles = function(whitelist) {
  var _this = this;
  whitelist = whitelist || [];

  return this.getSourcePaths(whitelist).map(function(sourcePath){
    return {
      name: path.basename(sourcePath),
      path: sourcePath,
      stream: null
    }
  });
};

ENV.prototype.getSourcePaths = function(whitelist) {
  var _this = this;
  var paths = [];

  this.eachEntry(this.sourcePath, function(filePath) {
    if (_this.trail.stat(filePath).isDirectory()) {
      return;
    }

    // Should the path be ignored based on the ignorePrefix?
    var matches = _this.ignorePrefixPattern.exec(filePath);
    if (matches) {
      return;
    }

    // Should the path be filtered out because it's not 
    // in the requested paths?
    var whitelisted = true;

    if(whitelist.length > 0) {
      var relativePath = path.relative(_this.sourcePath, filePath);
      whitelisted = whitelist.indexOf(relativePath) > -1;
    }

    if(!whitelisted) {
      return;
    }

    paths.push(filePath);
  });

  return paths;
};

ENV.prototype.eachEntry = function (root, iterator) {
  var _this = this,
      paths = [];

  this.trail.entries(root).forEach(function (filename) {
    var pathname  = path.join(root, filename),
        stats     = _this.trail.stat(pathname);

    if (!stats) {
      // File not found - silently skip it.
      // It might happen only if we got "broken" symlink in real life.
      // See https://github.com/nodeca/mincer/issues/18
      return;
    }

    paths.push(pathname);

    if (stats.isDirectory()) {
      _this.eachEntry(pathname, function (subpath) {
        paths.push(subpath);
      });
    }
  });

  paths.sort().forEach(iterator);
};

module.exports = ENV;
