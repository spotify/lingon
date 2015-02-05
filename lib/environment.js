var fs               = require('fs');
var path             = require('path');
var recursiveReaddir = require('./vendor/recursive-readdir');

var SourceFile      = require('./models/sourceFile');

var ENV = function(opts) {
  this.rootPath = opts.rootPath || '.';
  this.sourcePath = opts.sourcePath || 'source';
  this.ignorePrefixPattern = opts.ignorePrefixPattern || new RegExp('\/_');
};

ENV.prototype.getSourceFiles = function(whitelist, callback) {
  var _this = this;
  whitelist = whitelist || [];

  recursiveReaddir(_this.sourcePath, [_this.ignorePrefixPattern], function (err, files) {
    var whitelistedFiles;

    if(whitelist.length > 0) {
      whitelistedFiles = files.filter(function(filePath) {
        var relativeFilePath = path.relative(_this.sourcePath, filePath);

        if(whitelist.indexOf(relativeFilePath) > -1) {
          return true;
        }
      });
    }else{
      whitelistedFiles = files;
    }

    var sourceFiles = whitelistedFiles.map(function(sourcePath){
    return new SourceFile({
      name: path.basename(sourcePath),
      path: sourcePath
    })});

    callback(sourceFiles);
  });
};

module.exports = ENV;
