var path = require('path');
var es = require('event-stream');
var utils = require('./utils');

module.exports = function(pipeMap, config) {

  return es.through(function write(file) {
    var _this = this;

    var pipes = utils.pipesForFileExtensions(path.basename(file.path), pipeMap, config);
    console.log('data', file.path, pipes);

    if(pipes.length == 0) {
      _this.emit('data', file);
      return;
    }

    var stream = utils.createFileStream(file);
    stream = utils.applyPipes(stream, pipes);

    stream.on('data', function(newFile){
      _this.emit('data', newFile);
    });
  });

};
