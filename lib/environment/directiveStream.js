var vfs                 = require('vinyl-fs');
var es                  = require('event-stream');
var path                = require('path');
var from                = require('from')
var File                = require('vinyl');
var concat              = require('gulp-concat');
var minimatch           = require("minimatch");

var utils               = require('../utils');
var directiveParser     = require('./directiveParser');
var orderedMergeStream  = require('../orderedMergeStream');
var processorStream     = require('../processorStream');
var util                = require('util');
var log                 = require('../utils/log');

module.exports = function directiveStream(stream, env, lineage) {

  if(lineage == undefined) {
    lineage = [];
  }

  // Test to see if a the current glob pattern will include
  // the source file itself.
  function cyclicDependencyDetected(lineage, currentPath) {
    var count = 0;
    for(var i=0;i<lineage.length;i++) {
      if(lineage[i] == currentPath) {
        count++;
      }
    }

    return count > 1;
  }

  function directiveStreamFn(sourceFile, cb) {
    var stream=null;

    lineage.push(sourceFile.path);

    if(env.directiveFileTypes.indexOf(path.extname(sourceFile.path)) > -1) {
      var parsedFile = directiveParser(sourceFile.path, sourceFile.contents);
      var patterns = parsedFile.patterns;

      if(cyclicDependencyDetected(lineage, sourceFile.path)) {
        log('[Warning] File is trying to include itself (ignored): "' + path.relative(env.rootPath, sourceFile.path +'"'));

        if(sourceFile.path.indexOf(".js" > -1)) {
          var output = "//ERROR: Cyclic dependency in " + path.relative(env.rootPath, sourceFile.path) + '"';
        }else{
          var output = "\n";
        }

        cb(null, new File({
          base: path.dirname(sourceFile.path),
          path: sourceFile.path,
          contents: new Buffer(output)
        }));

        return;
      }

      var sourceStreams = patterns.map(function(pattern) {
        if(Array.isArray(pattern)) {
     
          var s = vfs.src(pattern);

          // Recursion
          s = s.pipe(directiveStream(stream, env, lineage));

          return s
        }else if(typeof pattern === 'string' && pattern === 'self') {
          var fileStream = utils.createFromStream(new File({
            base: path.dirname(sourceFile.path),
            path: sourceFile.path,
            contents: new Buffer(parsedFile.body)
          }));

          // It was necessary to pause _this_ stream for
          // the data to be emitted later.. why?
          fileStream.pause();
          return fileStream;

        }
      });

      // Merge the glob streams into one ordered stream
      stream = orderedMergeStream(sourceStreams);

      stream = stream.pipe(es.map(function(file, cb) {
        // Fix file's base for globbed streams
        file.base = path.dirname(sourceFile.path);

        cb(null, file);
      }));

    }else{
      stream = utils.createFromStream(new File({
        base: path.dirname(sourceFile.path),
        path: sourceFile.path,
        contents: new Buffer(sourceFile.contents)
      }));
    }

    stream = stream.pipe(
      processorStream(
        env.preProcessor,
        env.currentConfig,
        env.rootPath));

    stream = stream.pipe(concat(path.basename(sourceFile.path)));

    var newFile = null;

    stream.on('data', function(file) {
      console.log(util.inspect(file.contents.toString(), {showHidden: true, depth: null}))

      // Create a new file and trim the contents of stray whitespaces
      newFile = new File({
        base: file.base,
        path: file.path,
        contents: new Buffer(file.contents.toString().trim() + "\n")
      })
    });

    stream.on('end', function(file) {
      cb(null, newFile);
    });

  }

  return es.map(directiveStreamFn);
};
