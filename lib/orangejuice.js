var vm      = require('vm');
var es      = require('event-stream');
var concat  = require('gulp-concat');
var hike    = require('hike');
var Readable = require('stream').Readable;

var fs      = require('fs');
var path    = require('path');
var through = require('through');
var map     = require('map-stream');
var File    = require('gulp-util').File;

var from = require('from');
var source = require('vinyl-source-stream');
var Cat = require('Pipette').Cat;
var Sink = require('Pipette').Sink;
var footer = require('gulp-footer');

var directiveParser = require('./directiveParser');
var defaultProcessors = require('./defaultProcessors');

var OJ = function() {}

OJ.IGNORE_PREFIX_PATTERN = new RegExp('\/_');

OJ.prototype.setup = function(gulp, mode, rootPath) {
  var _this = this;
  this.rootPath = rootPath;

  this.sourcePath = 'source';
  this.buildPath = 'build';

  this.sourceFiles = [];

  this.gulp = gulp;
  this.mode = mode || "server"; // Server, Build or [Custom]

  this.configurations = {
    server: {},
    build: {}
  }

  this.preProcessors = defaultProcessors.pre;
  this.postProcessors = defaultProcessors.post;

  this.fileStreams = {};

  // Set up the main task that gulp will run
  this.gulp.task('oj:assets', function() {
    
    var streamList = [];

    for(var i=0;i<_this.sourceFiles.length;i++) {
      var sourceFile = _this.sourceFiles[i];

      var stream = null;
      var pipes = [];
      var postConcatPipes = [];

      console.log('OJ //>', sourceFile.path);
      console.log(sourceFile.patterns);

      // * If the source file specified directives, 
      // use glob the patterns as source. Then append the
      // body of the file as a footer with a postConcatPipe.
      // * Otherwise use the file body itself.
      if(sourceFile.patterns.length > 0) {
        stream = _this.gulp.src(sourceFile.patterns);
        postConcatPipes.push(footer(sourceFile.body));
      }else{
        // Closure to retain the correct sourceFile
        // until the getChunk function is called
        stream = (function(sourceFile){
          var sourceStream = from(function getChunk(count, next) {
            this.emit('data', new File({
              base: _this.sourcePath,
              path: path.join(_this.sourcePath, sourceFile.name),
              contents: new Buffer(sourceFile.body)
            }));

            this.emit('end');
          });

          return sourceStream;

        })(sourceFile);
      }

      pipes = pipes.concat(_this.pipesForFileExtensions(sourceFile.name, _this.preProcessors));

      // Concat the streams to a single file
      stream = stream.pipe(concat(sourceFile.name));

      // Add the postConcatPipes (compression, etc)
      pipes = pipes.concat(postConcatPipes);

      // Output files
      pipes.push(_this.gulp.dest(_this.buildPath));

      // Apply all pipes to stream
      stream = _this.applyPipes(stream, pipes);

      streamList.push(stream);
    }

    return es.concat.apply(_this, streamList);
  });

}

// Add pipes based on file extensions (in order: right -> left).
OJ.prototype.pipesForFileExtensions = function(filename, pipeMap) {
  var pipes = [];

  var extensions = filename.split('.');
  extensions.splice(0, 1)

  for(var extIndex=extensions.length-1;extIndex>=0;extIndex--) {
    var ext = extensions[extIndex];
    var pipeFactory = pipeMap[ext];
    if(pipeFactory) {
      console.log('Found pipe for: ', ext, {config: this.currentConfig()});
      pipes.push(pipeFactory({config: this.currentConfig()}));
    }
  }

  return pipes;
};

OJ.prototype.processSources = function() {
  var _this = this;

  var trail = this.trail = new hike.Trail(this.rootPath);

  trail.paths.append.apply(trail.paths, [this.sourcePath]);

  this.sourceFiles = [];

  // process.chdir(this.sourcePath);

  this.eachFile(function(filePath){
    var matches = OJ.IGNORE_PREFIX_PATTERN.exec(filePath);

    if(!matches) {

      var data = fs.readFileSync(filePath);
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
            patterns = patterns.concat(arguments);
            console.log(patterns)
          break;
        }
      }

      _this.sourceFiles.push({
        name: path.basename(filePath),
        path: filePath,
        body: results.body,
        patterns: patterns
      });
    }
  });
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
  var _this = this, paths = [];

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

OJ.prototype.applyPipes = function(stream, pipes) {
  for(var i=0;i<pipes.length;i++) {
    stream = stream.pipe(pipes[i]);
  }

  return stream;
};

OJ.prototype.configure = function(mode, configGetterFunc){
  this.configurations[mode] = configGetterFunc(this.configurations[mode] || {});
};

OJ.prototype.currentConfig = function() {
  return this.configurations[this.mode];
}

// Allows access to this class through the global instance.
OJ.prototype.klass = OJ;
// TODO: Change this to something like: require('orangejuice/klass');
// So that it's not necessary to instantiate the singleton to get
// a reference to the class.

var instance = new OJ();

module.exports = instance;