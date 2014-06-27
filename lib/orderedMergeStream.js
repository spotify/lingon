var from = require('from');
var log  = require('./utils/log');
var es   = require('event-stream');
var path = require('path');

module.exports = function(streams) {

  var ID = Math.round(Math.random() * 100);

  var isEmptyStream = false;
  return from(function getChunk(count, next) {
    var _this = this;

    var streamQueue = [];
    var currentStream = 0;

    // Emit everything available so far in the queue
    function emitData() {
      for(var i=0;i<streamQueue.length;i++) {
        var dataQueue = streamQueue[i].dataQueue;

        if(streamQueue[i].pending) {
          return;
        }

        for(var j=0;j<dataQueue.length;j++) {
          var data = dataQueue[j];
          if(!!data) {
            //console.log(ID, '<<< EMIT', i)
            //console.log(data.contents.toString());
            //console.log('');
            _this.emit('data', data);
            dataQueue[j] = null;

            return emitData();
          }
        }
      }

      if(currentStream === streamQueue.length) {
        _this.emit('end');
      }
    }

    function processStream(index, stream) {
      stream.on('data', function(data) {
        //console.log(ID, 'data', index)
        streamQueue[index].dataQueue.push(data);
        emitData();
      });
      stream.on('end', function() {
        currentStream++;
        //console.log(ID, 'end', index)
        streamQueue[index].pending = false;
        // The stream was empty and didn't send any data
        if(streamQueue[index].length === 0) {
          isEmptyStream = true;
          streamQueue[index].dataQueue.push(null);
        }

        //If we have received the last end event, end the whole stream.
        if(currentStream === streamQueue.length) {
          emitData();
        }
      });

      stream.resume();
    }

    for(var i=0;i<streams.length;i++) {
      streamQueue.push({dataQueue: [], pending: true});
    }

    for(var j=0;j<streams.length;j++) {
      processStream(j, streams[j]);
    }

  }).pipe(es.map(function(file, cb) {
    // No matching directives if empty stream and file path does not start with
    // a path seperator (and is therefore an absolute path). Directive globs
    // create a relative path
    if(isEmptyStream && file.path.indexOf(path.sep) !== 0) {
      log('[Info] Non-matching include directive found in "' + file.path + '"');
    }

    cb(null, file);
  }));
};
