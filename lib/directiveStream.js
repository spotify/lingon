var vfs                 = require('vinyl-fs');
var es                  = require('event-stream');
var path                = require('path');
var from                = require('from')
var File                = require('vinyl');
var concat              = require('gulp-concat');
var orderedMergeStream  = require('ordered-merge-stream');

var streamHelper        = require('./utils/stream');
var directiveParser     = require('./directiveParser');
var processorStream     = require('./processorStream');
var layoutStream        = require('./extensions/layoutStream');
var log                 = require('./utils/log');
var resumer = require('resumer');

module.exports = function directiveStream(env, context, node) {
  if(node == undefined) {
    node = {
      id: 'root',
      children: [],
      parent: undefined
    }
  }

  // Test to see if the current glob pattern will include
  // the source file itself.
  function cyclicDependencyDetected(node, currentPath) {
    var parent;

    while(parent = node.parent) {
      if(parent.id == currentPath) {
        return true
      }

      node = parent;
    }
  }

  function fromDirectives(sourceFile) {

  };

  function directiveStreamFn(sourceFile, cb) {
    var stream = null;
    var nextNode = {
      id: sourceFile.path,
      children: [],
      parent: node
    };

    node.children.push(nextNode);

    if(!context) {
      context = {
        file: {
          path: path.relative(env.rootPath, sourceFile.path),
          layout: ""
        }
      };
    }

    var isBlob = env.directiveFileTypes.indexOf(path.extname(sourceFile.path)) === -1;
    if(!isBlob) {
      var parsedFile = directiveParser(sourceFile.path, sourceFile.contents);
      var patterns = parsedFile.patterns;

      if(cyclicDependencyDetected(node, sourceFile.path)) {
        log('[Warning] File is trying to include itself (ignored): "' + path.relative(env.rootPath, sourceFile.path +'"'));

        if(sourceFile.path.indexOf(".js" > -1)) {
          var output = '//[lingon] ERROR: Cyclic dependency in "' + path.relative(env.rootPath, sourceFile.path) + '"';
        }else{
          var output = '';
        }

        cb(null, new File({
          base: path.dirname(sourceFile.path),
          path: sourceFile.path,
          contents: new Buffer(output)
        }));

        return;
      }

      var sourceStreams = patterns.map(function(pattern) {
        switch(pattern.type) {
          case 'include_glob':
            var s = vfs.src(pattern.args);

            // Recursion: If the current file contained include directives
            // we need to run this stream on their vfs.src streams in case
            // they also contain include directives. This enables support
            // for nested file include dependencies.
            s = s.pipe(directiveStream(env, null, nextNode));
            return s;
          break;
          case 'layout':
            var s = resumer();
            s.queue(new File({
              base: path.dirname(sourceFile.path),
              path: sourceFile.path,
              contents: new Buffer(pattern.args.contents)
            }));
            s.end();

            s = s.pipe(layoutStream(env, context, pattern.args.layout));
            return s;
          break;
          case 'include_inline':
            // Each sub-file include is assigned a unique index
            // to be treated as a separate file in the orderedMergeStream
            var index = pattern.index;
          case 'include_self':
            // There's no index for include_self
            if(!index) {
              index = "";
            }

            var fileStream = streamHelper.createFromStream(new File({
              base: path.dirname(sourceFile.path),
              path: sourceFile.path + index,
              contents: new Buffer(pattern.args.contents)
            }));

            // Pipe preProcessor streams 
            // (applied to every included file before concatenation)
            fileStream = preProcess(fileStream);

            return fileStream;
          break;
          default:
            throw("DirectiveStream: Unsupported pattern type: " + pattern.type);
          break;
        };
      });

      // Merge the glob streams into one ordered stream
      stream = orderedMergeStream(sourceStreams);

      stream = stream.pipe(es.map(function(file, cb) {
        // Fix file's base for globbed streams
        file.base = path.dirname(sourceFile.path);

        cb(null, file);
      }));

    }else{
      stream = streamHelper.createFromStream(new File({
        base: path.dirname(sourceFile.path),
        path: sourceFile.path,
        contents: new Buffer(sourceFile.contents)
      }));

      stream = preProcess(stream);
    }

    if(!isBlob) {
      stream = stream.pipe(concat(path.basename(sourceFile.path)));
    }

    var returnedFile = null;
    stream.on('data', function(file) {
      returnedFile = file;
    });

    stream.on('end', function() {
      cb(null, returnedFile);
    });

  }

  function preProcess(stream) {
    return stream.pipe(
      processorStream(
        env.preProcessors,
        context,
        env.global,
        env.rootPath));
  }

  return es.map(directiveStreamFn);
};
