var path  = require('path');
var es    = require('event-stream');
var streamHelper = require('./utils/stream');
var chalk = require('chalk');

module.exports = function(pipeMap, config, rootPath) {

  var resources = {};

  return es.map(function(file, cb) {
    // Rewrite path to be relative from the rootPath
    file.path = path.relative(rootPath, file.path);

    var pipes = streamHelper.pipesForFileExtensions(path.basename(file.path), pipeMap, config);

    if(pipes.length === 0) {
      cb(null, file);
      return;
    }

    // Do we already have a cached version?
    if(resources[file.path]) {
      cb(null, resources[file.path]);
      return;
    }

    console.log(
      '      ',
      chalk.yellow(file.path),
      '=>',
      pipes.map(function(pipe){ return pipe.name; }).join(' -> '));

    var stream = streamHelper.createFromStream(file);
    stream = streamHelper.applyPipes(stream, pipes);

    stream.on('data', function(newFile){
      resources[newFile.path] = newFile;
      cb(null, newFile);
    });

  });

};
