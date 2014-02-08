var chalk = require('chalk');
var log = require('./utils/log');

var es      = require('event-stream');
var concat  = require('gulp-concat');
var hike    = require('hike');
var fs      = require('fs');
var File   = require('vinyl');
var vfs     = require('vinyl-fs');
var path    = require('path');

var utils = require('./utils');
var directiveParser = require('./directiveParser');
var defaultProcessors = require('./defaultProcessors');
var processorStream = require('./processorStream');
var orderedMergeStream = require('./orderedMergeStream');

var OJ = function() {}

OJ.IGNORE_PREFIX_PATTERN = new RegExp('\/_');

OJ.prototype.setup = function(mode, rootPath) {
  this.rootPath = rootPath;

  this.sourcePath = 'source';
  this.buildPath = 'build';

  this.mode = mode || "server";

  this.configurations = {
    server: {},
    build: {}
  }

  this.validDirectiveFileTypes = ['.js', '.less', '.css'];

  this.preProcessors = defaultProcessors.pre;
  this.postProcessors = defaultProcessors.post;
}

OJ.prototype.run = function(requestPaths, cb) {
  var _this = this;
  var sourceFiles = this.processSources(requestPaths);
  
  var streamList = sourceFiles.map(function(file) {
    return _this.createFileStream(file);
  });

  var allStreams = es.concat.apply(_this, streamList);

  if(!!cb) {
    allStreams.on('end', function() {
      cb();
    });
  }

  return allStreams;
};

OJ.prototype.createFileStream = function(sourceFile) {
  var _this = this; 

  var destFilePath = path.dirname(sourceFile.path.replace(_this.sourcePath, _this.buildPath));
  var currentConfig = _this.currentConfig();

  var stream = null;
  var pipes = [];
  var postConcatPipes = [];

  // * If the source file specified directives, 
  // use glob the patterns as source. Then append the
  // body of the file as a footer with a postConcatPipe.
  // * Otherwise use the file body itself.
  var patterns = sourceFile.patterns;

  if(patterns.length > 0) {

    var sourceStreams = patterns.map(function(pattern) {
      if(Array.isArray(pattern)) {

        return vfs.src(pattern);

      }else if(typeof pattern === 'string' && pattern == 'self') {
        var fileStream = utils.createFromStream(new File({
          base: path.dirname(sourceFile.path),
          path: sourceFile.path,
          contents: new Buffer(sourceFile.body)
        }));

        // It was necessary to pause _this_ stream for 
        // the data to be emitted later.. why?
        fileStream.pause();
        return fileStream;

      }
    });

    stream = orderedMergeStream(sourceStreams);

    // var log = function(file, cb) {
    //   console.log('file:', file.path);
    //   cb(null, file);
    // };
    // stream = stream.pipe(es.map(log));

    // Concat the glob streams to a single file.
    pipes.push({
      name: 'concat', 
      stream: concat(sourceFile.name)
    });

  }else{
    stream = utils.createFromStream(new File({
      base: path.dirname(sourceFile.path),
      path: sourceFile.path,
      contents: new Buffer(sourceFile.body)
    }));
  }

  stream = stream.pipe(
    processorStream(
      _this.preProcessors, 
      currentConfig,
      _this.rootPath));

  postConcatPipes = postConcatPipes.concat(
    utils.pipesForFileExtensions(
      sourceFile.name, 
      _this.postProcessors,
      currentConfig));

  // Queue the postConcatPipes (less, compression, etc)
  pipes = pipes.concat(postConcatPipes);

  // Queue the output pipe
  pipes.push({
    name: 'vfs-dest', 
    stream: vfs.dest(destFilePath)
  });

  log(chalk.green(sourceFile.path), 
      '=>', 
      pipes.map(function(pipe){ return pipe.name; }).join(' -> '));

  // Apply all pipes to stream
  stream = utils.applyPipes(stream, pipes);

  return stream;
};

OJ.prototype.processSources = function(requestPaths) {
  var _this = this;
  var sourceFiles = [];

  var trail = this.trail = new hike.Trail(this.rootPath);

  trail.paths.append.apply(trail.paths, [this.sourcePath]);

  this.eachFile(function(filePath){

    //Filter out files / folders starting with a _ character.
    var matches = OJ.IGNORE_PREFIX_PATTERN.exec(filePath);

    if(!matches) {

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
OJ.prototype.eachEntry = function (root, iterator) {
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


/**
 *  Base#eachFile(iterator) -> Void
 *  - iterator (Function)
 *
 *  Calls `iterator` for each file found within all registered paths.
 **/
OJ.prototype.eachFile = function (iterator) {
  var _this = this;

  var paths = [this.sourcePath];
  paths.forEach(function (root) {
    _this.eachEntry(root, function (pathname) {
      if (!_this.trail.stat(pathname).isDirectory()) {
        iterator(pathname);
      }
    });
  });
};

OJ.prototype.configure = function(mode, configGetterFunc){
  this.configurations[mode] = configGetterFunc(this.configurations[mode] || {});
};

OJ.prototype.currentConfig = function() {
  return this.configurations[this.mode];
}

module.exports = OJ;