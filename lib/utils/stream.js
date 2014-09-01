var chalk = require('chalk');
var from  = require('from');
var log   = require('../utils/log');

module.exports = {
  pipesForFileExtensions: function(filename, processorStore, global, context) {
    var pipes = [];

    var extensions = filename.split('.');
    extensions.splice(0, 1);
    extensions.reverse();

    extensions.forEach(function(ext) {
      var pipeFactories = processorStore.get(ext, filename);

      if(pipeFactories) {
        pipeFactories.forEach(function(pipeFactory) {
          var pipeArray = pipeFactory.pipe(global, context);

          // factory did not return a pipe
          if(!pipeArray) { return; }

          // convert non-array return values for easier iteration
          if(!Array.isArray(pipeArray)) { pipeArray = [pipeArray]; }

          pipeArray.forEach(function(pipe) {
            if(pipe) {
              pipes.push(pipe);
            }
          });
        });
      }
    });

    return pipes;
  },
  applyPipes: function(stream, pipes) {
    for(var i=0;i<pipes.length;i++) {
      stream = stream.pipe(pipes[i]).on('error', function(error) {
        var message;
        if(!error || !error.message) {
          message = 'An unknown error occured in the pipes';
        } else {
          message = error.message;
        }

        log( chalk.yellow('[Stream Error] ' + message) );
      });
    }

    return stream;
  },
  createFromStream: function(file) {
    return from(function getChunk(count, next) {
      var _this = this;
      // Start emitting data on the next tick to allow 
      // stream chains to be constructed (callbacks added).
      process.nextTick(function() {
        _this.emit('data', file);
        _this.emit('end');
      });
    });
  }
};
