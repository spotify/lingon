var path  = require('path');
var es    = require('event-stream');
var utils = require('./utils');
var chalk = require('chalk');

module.exports = function(pipeMap, config, rootPath) {

  return es.map(function(file, cb) {
    // Rewrite path to be relative from the rootPath
    file.path = path.relative(rootPath, file.path);

    var pipes = utils.pipesForFileExtensions(path.basename(file.path), pipeMap, config);

    if(pipes.length === 0) {
      cb(null, file);
      return;
    }

    // console.log(
    //   '      ',
    //   chalk.yellow(file.path),
    //   '=>',
    //   pipes.map(function(pipe){ return pipe.name; }).join(' -> '));

    var stream = utils.createFromStream(file);
    stream = utils.applyPipes(stream, pipes);

    stream.on('data', function(newFile){
      cb(null, newFile);
    });

  });

};
