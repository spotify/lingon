var vm = require('vm');
var es = require('event-stream');
var concat = require('gulp-concat');
var FutureStream = require('./futureStream');

var OJ = function(gulp, mode, ojfile) {
  var _this = this;

  this.gulp = gulp;
  this.mode = "server"; // Server, Build or [Custom]

  this.defaultPipes = {
    ".ejs": function() {
      return [
        ejs(_this.configs[_this.mode])
      ]
    }
  };

  this.fileStreams = {};

  this.configurations = {
    server: {},
    build: {}
  }

  // ojfile dsl
  var context = vm.createContext({
    javascript: function(filename, patterns){
      console.log('javascript:', filename);
      var stream = _this.fileStream(filename, patterns)
      return stream;
    },
    stylesheet: function(filename, patterns){
      console.log('stylesheet:', filename);
    },
    page: function(filename){
      console.log('page:', filename);
    },
    configure: function(mode, configGetterFunc){
      _this.configurations[mode] = configGetterFunc(_this.configurations[mode] || {});
    }
  });

  //TODO: Report syntax errors in ojfile better, if possible..
  vm.runInContext(ojfile, context, 'ojfile.js');

  // Set up the main task that gulp will run
  this.gulp.task('oj:assets', function() {
    
    var streamList = [];

    for(var filename in _this.fileStreams) {
      var futureStream = _this.fileStreams[filename];

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
      for(var i=0;i<pipes.length;i++) {
        stream = stream.pipe(pipes[i]);
      }

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

module.exports = OJ;