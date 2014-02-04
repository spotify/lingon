var from = require('from');

module.exports = function(streams) {

  return from(function getChunk(count, next) {
    var _this = this;

    var streamQueue = [];
    var currentStream = 0;

    // Emit everything available in the queue
    function emitData() {
      for(var i=0;i<streamQueue.length;i++) {
        var dataQueue = streamQueue[i];

        if(dataQueue.length == 0) {
          return;
        }

        for(var j=0;j<dataQueue.length;j++) {
          var data = dataQueue[j];
          if(!!data) {
            console.log('DONE:', currentStream, data.path)
            _this.emit('data', data);
            dataQueue[j] = null;

            return emitData();
          }
        }
      }

      // console.log('end?', currentStream, streamQueue.length);
      if(currentStream == streamQueue.length) {
        // console.log('END!')
        _this.emit('end');
      }
    }

    function processStream(index, stream) {
      stream.on('data', function(data) {
        // console.log('on.data:', 'index:', index, 'file:', data.path);
        streamQueue[index].push(data);
        emitData();
      });
      stream.on('end', function() {
        // console.log('end', currentStream, 'queue:', streamQueue);
        currentStream++;

        // The stream was empty and didn't send any data
        if(streamQueue[index].length == 0) {
          streamQueue[index].push(null);
          return;
        }

        //If we have received the last end event, end the whole stream.
        if(currentStream == streamQueue.length) {
          emitData();
        }
      })

      stream.resume();
    }

    for(var i=0;i<streams.length;i++) {
      streamQueue.push([]);
    }

    for(var j=0;j<streams.length;j++) {
      processStream(j, streams[j]);
    }

    // this.emit('data', file);
    // this.emit('end');

  });
};