var from = require('from');

module.exports = {
  pipesForFileExtensions: function(filename, pipeMap, config) {
    var pipes = [];

    var extensions = filename.split('.');
    extensions.splice(0, 1)

    for(var extIndex=extensions.length-1;extIndex>=0;extIndex--) {
      var ext = extensions[extIndex];
      var pipeFactory = pipeMap[ext];
      if(pipeFactory) {
        var pipe = pipeFactory({config: config});
        pipes.push(pipe);
      }
    }

    return pipes;
  },
  applyPipes: function(stream, pipes) {
    for(var i=0;i<pipes.length;i++) {
      stream = stream.pipe(pipes[i].stream);
    }

    return stream;
  },
  createFileStream: function(file) {
//    var used = false;

    return from(function getChunk(count, next) {
//      if(used) return;
//      used = true;

      this.emit('data', file);

      this.emit('end');
    });
  }
};