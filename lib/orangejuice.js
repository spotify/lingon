var es      = require('event-stream');
var concat  = require('gulp-concat');
var hike    = require('hike');
var gutil = require('gulp-util');

var fs      = require('fs');
var path    = require('path');
var File    = require('gulp-util').File;

var from = require('from');
var footer = require('gulp-footer');

var utils = require('./utils');
var directiveParser = require('./directiveParser');
var defaultProcessors = require('./defaultProcessors');
var processorStream = require('./processorStream');

var OJ = function() {}

OJ.IGNORE_PREFIX_PATTERN = new RegExp('\/_');

OJ.prototype.setup = function(gulp, mode, rootPath) {
  this.rootPath = rootPath;

  this.sourcePath = 'source';
  this.buildPath = 'build';

  this.gulp = gulp;
  this.mode = mode || "server"; // Server, Build or [Custom]

  this.configurations = {
    server: {},
    build: {}
  }

  this.validDirectiveFileTypes = ['.js', '.less'];

  this.preProcessors = defaultProcessors.pre;
  this.postProcessors = defaultProcessors.post;
}

// Set up the main task that gulp will run
OJ.prototype.run = function(cb) {
  var sourceFiles = this.processSources();

  var _this = this; 
  
  var streamList = [];

  for(var i=0;i<sourceFiles.length;i++) {
    var sourceFile = sourceFiles[i];
    var destFilePath = path.dirname(sourceFile.path.replace(_this.sourcePath, _this.buildPath));

    var stream = null;
    var pipes = [];
    var postConcatPipes = [];

    // * If the source file specified directives, 
    // use glob the patterns as source. Then append the
    // body of the file as a footer with a postConcatPipe.
    // * Otherwise use the file body itself.
    if(sourceFile.patterns.length > 0) {
      stream = _this.gulp.src(sourceFile.patterns);

      // Concat the glob streams to a single file.
      pipes.push({
        name: 'concat', 
        stream: concat(sourceFile.name)
      });

      // Append the source file body after includes.
      postConcatPipes.push({
        name: 'footer', 
        stream: footer(sourceFile.body)
      });
    }else{

      // Closure to retain the correct sourceFile
      // until the getChunk function is called.
      // Spaghetti code! Refactor soon..
      stream = (function(sourceFile){
        // TODO: Why the hell do I need this 'used' hack to avoid
        // repeated emission of 'data' when processing .less files???
        var used = false;

        var sourceStream = from(function getChunk(count, next) {
          if(used) return;
          used = true;

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

    stream = stream.pipe(
      processorStream(
        _this.preProcessors, 
        _this.currentConfig(),
        _this.rootPath));

    postConcatPipes = postConcatPipes.concat(
      utils.pipesForFileExtensions(
        sourceFile.name, 
        _this.postProcessors));

    // Add the postConcatPipes (compression, etc)
    pipes = pipes.concat(postConcatPipes);

    // Output files
    pipes.push({
      name: 'gulp-dest', 
      stream: _this.gulp.dest(destFilePath)
    });

    console.log(
      "[ " + gutil.colors.yellow('OJ') + " ]", 
      gutil.colors.green(sourceFile.path), 
      '=>', 
      pipes.map(function(pipe){ return pipe.name; }).join(' -> '));

    // Apply all pipes to stream
    stream = utils.applyPipes(stream, pipes);

    streamList.push(stream);
  }

  var allStreams = es.concat.apply(_this, streamList);

  if(!!cb) {
    allStreams.on('end', function() {
      console.log('done, done!');
      cb();
    });
  }

};

OJ.prototype.processSources = function() {
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
              patterns = patterns.concat(arguments);
            break;
          }
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

// Allows access to this class through the global instance.
OJ.prototype.klass = OJ;
// TODO: Change this to something like: require('orangejuice/klass');
// So that it's not necessary to instantiate the singleton to get
// a reference to the class.

var instance = new OJ();

module.exports = instance;