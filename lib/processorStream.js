var path = require('path');
var es = require('event-stream');
var utils = require('./utils');
var gutil = require('gulp-util');

module.exports = function(pipeMap, config) {

  return es.through(function write(file) {
    var _this = this;

    var pipes = utils.pipesForFileExtensions(path.basename(file.path), pipeMap, config);

    if(pipes.length == 0) {
      _this.emit('data', file);
      return;
    }

    console.log(
      '      ',
      gutil.colors.yellow(file.path), 
      '=>', 
      pipes.map(function(pipe){ return pipe.name; }).join(' -> '));

    var stream = utils.createFileStream(file);
    stream = utils.applyPipes(stream, pipes);

    stream.on('data', function(newFile){
      _this.emit('data', newFile);
    });
  });

};
