var hike    = require('hike');
var fs      = require('fs');
var path    = require('path');

var directiveParser = require('./directiveParser');

var ENV = function(opts) {
  this.rootPath = opts.rootPath || '.';
  this.sourcePath = opts.sourcePath || 'source';
  this.ignorePrefixPattern = opts.ignorePrefixPattern || new RegExp('\/_');
  this.validDirectiveFileTypes = opts.validDirectiveFileTypes || [];

  this.trail = new hike.Trail(this.rootPath);
  this.trail.paths.append.apply(this.trail.paths, [this.sourcePath]);
};

ENV.prototype.getSourceFiles = function(whitelist) {
  var _this = this;
  var sourceFiles = [];
  whitelist = whitelist || [];

  this.eachFile(function(filePath){
    //Filter out files / folders starting with a certain character. Default: _
    var matches = _this.ignorePrefixPattern.exec(filePath);
    var whitelisted = true;

    if(whitelist.length > 0) {
      var relativePath = path.relative(_this.sourcePath, filePath);
      whitelisted = whitelist.indexOf(relativePath) > -1;
    }

    if(!matches && whitelisted) {

      var data = fs.readFileSync(filePath);

      // Does the file type support directives? (js, etc)
      if(_this.validDirectiveFileTypes.indexOf(path.extname(filePath)) > -1) {

        var results = directiveParser(data);

        var patterns = [];
        for(var i=0;i<results.directives.length;i++) {
          var directive = results.directives[i];
          var directiveType = directive[1];
          var arguments = directive[2];

          switch(directiveType) {
            // Only the 'include' directive is supported, for simplicity.
            case "include":
              var absolutePath = path.dirname(path.resolve(filePath));

              arguments = arguments.map(function(argument){ 
                var prefix = '';

                if(argument.charAt(0) == '!') {
                  prefix = '!';
                  argument = argument.substring(1);
                }

                return prefix + path.join(absolutePath, argument)
              });

              patterns.push(arguments);
            break;
            case "include_self":
              if(patterns.indexOf('self') > -1) {
                throw("Orangejuice: Multiple 'include_self' directives found in " + filePath);
              }

              patterns.push('self');
            break;
          }
        }

        // Add an implicit include_self at the end if none was declared.
        if(patterns.indexOf('self') == -1) {
          patterns.push('self');
        }

        sourceFiles.push({
          type: "directive",
          name: path.basename(filePath),
          path: filePath,
          body: results.body,
          patterns: patterns
        });

      }else{
        // The file does not support directives, just copy the contents.
        sourceFiles.push({
          type: "binary",
          name: path.basename(filePath),
          path: filePath,
          body: data,
          patterns: []
        });
      }

    }
  });
  
  return sourceFiles;
}

/**
 *  Base#eachFile(iterator) -> Void
 *  - iterator (Function)
 *
 *  Calls `iterator` for each file found within all registered paths.
 **/
ENV.prototype.eachFile = function (iterator) {
  var _this = this;

  [this.sourcePath].forEach(function (root) {
    _this.eachEntry(root, function (pathname) {
      if (!_this.trail.stat(pathname).isDirectory()) {
        iterator(pathname);
      }
    });
  });
};

/**
 *  OJ#eachEntry(root, iterator) -> Void
 *  - root (String)
 *  - iterator (Function)
 *
 *  Calls `iterator` on each found file or directory in alphabetical order:
 *
 *      env.eachEntry('/some/path', function (entry) {
 *        console.log(entry);
 *      });
 *      // -> "/some/path/a"
 *      // -> "/some/path/a/b.txt"
 *      // -> "/some/path/a/c.txt"
 *      // -> "/some/path/b.txt"
 **/
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