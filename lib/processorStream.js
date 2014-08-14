var path  = require('path');
var es    = require('event-stream');
var streamHelper = require('./utils/stream');
var chalk = require('chalk');

module.exports = function(pipeMap, context, global, rootPath, cache) {

  if(!cache) {
    var cache = {};
  }

  return es.map(function(file, cb) {
    // Rewrite path to be relative from the rootPath
    var filePath = file.path;

    file.path = path.relative(rootPath, file.path);

    var pipes = streamHelper.pipesForFileExtensions(path.basename(file.path), pipeMap, global, context);

    if(pipes.length === 0) {
      cb(null, file);
      return;
    }

    // Do we already have a cached version?
    // console.log(path.resolve(file.path), cache)
    if(!!cache[path.resolve(filePath)]) {
      cb(null, cache[path.resolve(filePath)]);
      return;
    }

    // console.log(
    //   '      ',
    //   chalk.yellow(file.path),
    //   '=>',
    //   pipes.map(function(pipe){ return pipe.name; }).join(' -> '));

    var stream = streamHelper.createFromStream(file);
    stream = streamHelper.applyPipes(stream, pipes);

    stream.on('data', function(newFile){
      newFile.path = filePath;
      cache[path.resolve(filePath)] = newFile;
      cb(null, newFile);
    });

  });

};
