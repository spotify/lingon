var path          = require('path');
var es            = require('event-stream');
var chalk         = require('chalk');
var streamHelper  = require('../utils/stream');

module.exports = function(pipeMap, context, global, rootPath) {

  return es.map(function(file, cb) {
    // Rewrite path to be relative from the rootPath
    var filePath = file.path;
    
    var params = {
      global: global, 
      context: context
    }

    file.path = path.relative(rootPath, file.path);

    var pipes = streamHelper.pipesForFileExtensions(path.basename(file.path), pipeMap, params);

    if(pipes.length === 0) {
      cb(null, file);
      return;
    }

    var stream = streamHelper.createFromStream(file);
    stream = streamHelper.applyPipes(stream, pipes);

    stream.on('data', function(newFile){
      newFile.path = filePath;
      cb(null, newFile);
    });

  });

};
