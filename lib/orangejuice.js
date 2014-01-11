var vm      = require('vm');
var es      = require('event-stream');
var concat  = require('gulp-concat');
var hike    = require('hike');

var fs      = require('fs');
var path    = require('path');


var ojUtils = require('./ojUtils');
var FutureStream = require('./futureStream');

var OJ = function() {}

OJ.IGNORE_PREFIX_PATTERN = new RegExp('\/_');

OJ.prototype.setup = function(gulp, mode, rootPath) {
  var _this = this;
  this.rootPath = rootPath;
  this.paths = [];

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

  // // Set up the main task that gulp will run
  // this.gulp.task('oj:assets', function() {
    
  //   var streamList = [];

  //   for(var i=0;i<_this.sourceFiles.length;i++) {
  //     var sourceFile = _this.sourceFiles[i];

  //     console.log('OJ //>', sourceFile);
  //     var stream = _this.gulp.src(sourceFile);
  //     var pipes = [];

  //     // Output files
  //     pipes.push(_this.gulp.dest('build'));

  //     // Apply pipes to stream
  //     stream = _this.applyPipes(stream, pipes);

  //     streamList.push(stream);
  //   }

  //   return es.concat.apply(_this, streamList);
  // });

}

OJ.prototype.processPaths = function() {
  var _this = this;

  var trail = this.trail = new hike.Trail(this.rootPath);

  trail.paths.append.apply(trail.paths, this.paths);

  this.sourceFiles = [];

  this.eachFile(function(filename){
    var matches = OJ.IGNORE_PREFIX_PATTERN.exec(filename);

    if(!matches) {
      _this.sourceFiles.push(filename);
    }
  });
}

OJ.prototype.setSourcePath = function(path) {
  this.paths.push(path);
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

  this.paths.forEach(function (root) {
    _this.eachEntry(root, function (pathname) {
      if (!_this.trail.stat(pathname).isDirectory()) {
        iterator(pathname);
      }
    });
  });
};


OJ.prototype.fileStream = function(filename, patterns) {
  var st = this.fileStreams[filename];

  if(!st) { 
    st = new FutureStream(filename, patterns);

    this.fileStreams[filename] = st;
  }
  
  return st;
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