var vm      = require('vm');
var es      = require('event-stream');
var concat  = require('gulp-concat');
var hike    = require('hike');

var fs      = require('fs');
var path    = require('path');
var through = require('through');

var directiveParser = require('./directiveParser');

var OJ = function() {}

OJ.IGNORE_PREFIX_PATTERN = new RegExp('\/_');

OJ.prototype.setup = function(gulp, mode, rootPath) {
  var _this = this;
  this.rootPath = rootPath;

  this.sourcePath = 'source';
  this.buildPath = 'build';

  this.sourceFiles = [];

  this.gulp = gulp;
  this.mode = "server"; // Server, Build or [Custom]

  this.configurations = {
    server: {},
    build: {}
  }

  this.defaultPipes = {
    page: [
      // This should be conditionally run only if the file ending is .ejs
      //ejs(_this.configurations[_this.mode])
    ]
  };

  this.fileStreams = {};

  // Set up the main task that gulp will run
  this.gulp.task('oj:assets', function() {
    
    var streamList = [];

    for(var i=0;i<_this.sourceFiles.length;i++) {
      var sourceFile = _this.sourceFiles[i];

      var sourceBodyStream = through(function write(data) {
        this.emit('data', sourceFile.body);
      })

      var stream = null;
      var pipes = [];
      var postConcatPipes = [];

      console.log('OJ //>', sourceFile.path);
      console.log(sourceFile.patterns);

      // * If the source file specified directives, 
      // use glob the patterns as source.
      // * Otherwise use the file body itself.
      if(sourceFile.patterns.length > 0) {
        stream = _this.gulp.src(sourceFile.patterns);

        // Append the body of the source file after 
        // all includes.
        postConcatPipes.push(sourceBodyStream);

      }else{
        stream = sourceBodyStream;
      }

      // Concat the streams
      pipes.push(concat(sourceFile.name));

      // Add the postConcatPipes
      pipes.concat(postConcatPipes);

      // Output files
      pipes.push(_this.gulp.dest(_this.buildPath));

      // Apply all pipes to stream
      stream = _this.applyPipes(stream, pipes);

      streamList.push(stream);
    }

    return es.concat.apply(_this, streamList);
  });

}

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

            arguments = arguments.map(function(argument){ return path.join(absolutePath, argument)}); //_this.sourcePath + '/' + 
            patterns = patterns.concat(arguments);
          break;
        }
      }

      _this.sourceFiles.push({
        name: path.basename(filePath),
        path: filePath,
        data: results.body,
        patterns: patterns
      });
    }
  });
}

OJ.prototype.setSourcePath = function(pathString) {
  this.sourcePath = pathString;
};

OJ.prototype.setBuildPath = function(pathString) {
  this.buildPath = pathString;
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

// Allows access to this class through the global instance.
OJ.prototype.klass = OJ;
// TODO: Change this to something like: require('orangejuice/klass');
// So that it's not necessary to instantiate the singleton to get
// a reference to the class.

var instance = new OJ();

module.exports = instance;