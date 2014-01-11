var vm = require('vm');
var es = require('event-stream');
var concat = require('gulp-concat');
var FutureStream = require('./futureStream');

var OJ = function() {}

OJ.prototype.setup = function(gulp, mode) {
  var _this = this;

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

    for(var filename in _this.fileStreams) {
      var futureStream = _this.fileStreams[filename];

      console.log(futureStream.patterns)
      var stream = _this.gulp.src(futureStream.patterns);
      var pipes = [];

      // Pipes before concat
      if(!!futureStream.lastStream) {
        pipes.push(futureStream.lastStream);
      }

      // Concat files
      pipes.push(concat(filename));

      // Pipes after concat
      if(!!futureStream.lastPostStream) {
        pipes.push(futureStream.lastPostStream);
      }

      // Output files
      pipes.push(_this.gulp.dest('build'));

      // Apply pipes to stream
      stream = _this.applyPipes(stream, pipes);

      streamList.push(stream);
    }

    return es.concat.apply(_this, streamList);
  });
}

OJ.prototype.pipes = function(stream, pipes){
  for(var i=0;i<pipes.length;i++) {
    var pipe = pipes[i];
    stream.pipe(pipe);
  }
  return stream;
};

OJ.prototype.fileStream = function(filename, patterns) {
  var st = this.fileStreams[filename];

  if(!st) { 
    st = new FutureStream(filename, patterns);

    this.fileStreams[filename] = st;
  }
  
  return st;
}

OJ.prototype.applyPipes = function(stream, pipes) {
  for(var i=0;i<pipes.length;i++) {
    stream = stream.pipe(pipes[i]);
  }

  return stream;
};

OJ.prototype.javascript = function(filename, patterns){
  console.log('javascript:', filename);
  var stream = this.fileStream(filename, patterns)
  return stream;
};

OJ.prototype.stylesheet = function(filename, patterns){
  console.log('stylesheet:', filename);
};

OJ.prototype.page = function(filename, patterns){
  console.log('page:', filename);
  var stream = this.fileStream(filename, patterns)
  stream = this.applyPipes(stream, this.defaultPipes.page);
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