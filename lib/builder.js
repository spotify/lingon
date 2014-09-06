var log                   = require('./utils/log');
var chalk                 = require('chalk');
var es                    = require('event-stream');
var path                  = require('path');
var vfs                   = require('vinyl-fs');

var directiveStream       = require('./streams/directiveStream');
var streamHelper          = require('./utils/stream');

var Builder = function() {};

Builder.createPipeline = function(sourceFile) {
  var transforms = Array.prototype.slice.call(arguments, 1);
  
  for(var i=0;i<transforms.length;i++) {
    sourceFile = transforms[i].call(this, sourceFile);
  }

  return sourceFile;
};

Builder.source = function(sourceStream) {
  return function(sourceFile) {
    sourceFile.stream = sourceStream;
    return sourceFile;
  };
}

Builder.preProcess = function(params) {
  return function(sourceFile) {
    sourceFile.stream = sourceFile.stream.pipe(
      directiveStream({
        rootPath: params['rootPath'],
        sourcePath: params['config'].sourcePath,
        directiveFileTypes: params['config'].validDirectiveFileTypes,
        preProcessors: params['processorStore'],
        global: params['global'],
        extensionRewriter: params['extensionRewriter'],
        directiveStream: directiveStream
      })
    );

    return sourceFile;
  }
};

Builder.postProcess = function(params) {
  return function(sourceFile) {
    var pipes = streamHelper.pipesForFileExtensions(
                  sourceFile.name,
                  params['processorStore'],
                  params['global']
                );

    // Apply all pipes to stream
    sourceFile.stream = streamHelper.applyPipes(sourceFile.stream, pipes);

    return sourceFile;
  }
};

Builder.rewriteExtension = function(params) {
  return function(sourceFile) {
    var extensionRewriter = params['extensionRewriter'];
    var sourceFilename = path.basename(sourceFile.path);
    var targetFilename = extensionRewriter.transform(sourceFilename, params.processorStores);

    sourceFile.targetFilename = targetFilename

    // Queue the inspect pipe, rewrite the output filename
    var inspect = function(file, cb) {
      var filename = path.basename(file.path);
      file.path = file.path.replace(filename, sourceFile.targetFilename);

      cb(null, file);
    };

    sourceFile.stream = sourceFile.stream.pipe(es.map(inspect));

    return sourceFile;
  }
};

Builder.print = function(sourceFile) {
  log(chalk.green(sourceFile.path, "->", path.join(sourceFile.targetPath, sourceFile.targetFilename)));
  return sourceFile;
};

Builder.normalizeFilePath = function(sourceFile) {
  sourceFile.stream.pipe(es.map(function(file, cb){
    file.base = path.resolve(process.cwd(), sourceFile.targetPath);
    file.path = path.resolve(file.base, path.basename(file.path));
    cb(null, file);
  }));
  return sourceFile;
};

Builder.writeFile = function(sourceFile) {
  sourceFile.stream = sourceFile.stream.pipe(vfs.dest(sourceFile.targetPath));
  log(chalk.green(sourceFile.path, "->", path.join(sourceFile.targetPath, sourceFile.targetFilename)));
  return sourceFile;
};

Builder.aggregateStreams = function(sourceFiles) {
  var outputStreams = sourceFiles.map(function(sourceFile) {
    return sourceFile.stream;
  });

  return es.concat.apply(this, outputStreams);
}

module.exports = Builder;