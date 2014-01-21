var from = require('from');

module.exports = function(streams) {

  return from(function getChunk(count, next) {
    var _this = this;

    var streamQueue = [];
    var currentStream = 0;

    // Emit everything available in the queue
    function emitData() {
      console.log('meep')
      var allNull = true;

      for(var i=0;i<currentStream;i++) {
        var dataQueue = streamQueue[i];

        for(var j=0;j<dataQueue.length;j++) {
          var data = dataQueue[j];
          if(!!data) {
            allNull = false;
            _this.emit('data', data);
            dataQueue[j] = null;

            emitData();
          }
        }
      }

      console.log(allNull, currentStream, streamQueue.length-1);
      if(allNull && currentStream == streamQueue.length-1) {
        console.log('END!')
        _this.emit('end');
      }
    }

    function processStream(index, stream) {
      stream.on('data', function(data) {
        console.log('index:', index, 'file:', data.path);
        streamQueue[currentStream].push(data);
        emitData();
      });
      stream.on('end', function() {
        //console.log('end', currentStream, 'queue:', streamQueue);
        currentStream++;

        //If we have received the last end event, end the whole stream.
        if(currentStream == streamQueue.length-1) {
          emitData();
        }
      })
    }

    for(var i=0;i<streams.length;i++) {
      processStream(i, streams[i]);
      streamQueue.push([]);
    }

    // this.emit('data', file);
    // this.emit('end');

  });
};