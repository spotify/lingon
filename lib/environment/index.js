var hike            = require('hike');
var fs              = require('fs');
var path            = require('path');
var vfs             = require('vinyl-fs');
var es              = require('event-stream');

var directiveStream = require('./directiveStream');

var ENV = function(opts) {
  this.rootPath = opts.rootPath || '.';
  this.sourcePath = opts.sourcePath || 'source';
  this.ignorePrefixPattern = opts.ignorePrefixPattern || new RegExp('\/_');
  this.validDirectiveFileTypes = opts.validDirectiveFileTypes || [];

  this.trail = new hike.Trail(this.rootPath);
  this.trail.paths.append(this.sourcePath);

  this.preProcessor = opts.preProcessor;
  this.currentConfig = opts.currentConfig;
};

ENV.prototype.getSourceFiles = function(whitelist) {
  var _this = this;
  whitelist = whitelist || [];

  var sourcePaths = this.getSourcePaths(whitelist);

  var sourceFiles = sourcePaths.map(function(filePath) {
    var stream = vfs.src(filePath);

    stream = stream.pipe(directiveStream(stream, {
      directiveFileTypes: _this.validDirectiveFileTypes,
      preProcessor: _this.preProcessor,
      rootPath: _this.rootPath
    }));

    return {
      path: filePath,
      name: path.basename(filePath),
      stream: stream
    };
  });

  return sourceFiles;
};

ENV.prototype.getSourcePaths = function(whitelist) {
  var _this = this;
  var paths = [];

  this.eachEntry(this.sourcePath, function(filePath) {
    if (_this.trail.stat(filePath).isDirectory()) {
      // console.log('dir', filePath)
      return;
    }

    var matches = _this.ignorePrefixPattern.exec(filePath);
    if (matches) {
      // console.log('ignore', filePath);
      return;
    }

    var whitelisted = true;

    if(whitelist.length > 0) {
      var relativePath = path.relative(_this.sourcePath, filePath);
      whitelisted = whitelist.indexOf(relativePath) > -1;
    }

    if(!whitelisted) {
      // console.log('!whitelisted', filePath);
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
