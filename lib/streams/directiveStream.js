'use strict';

var vfs                 = require('vinyl-fs');
var es                  = require('event-stream');
var path                = require('path');
var File                = require('vinyl');
var concat              = require('gulp-concat');
var orderedMergeStream  = require('ordered-merge-stream');
var resumer             = require('resumer');

var streamHelper        = require('../utils/stream');
var directiveParser     = require('../directives/directiveParser');
var processorStream     = require('./processorStream');
var layoutStream        = require('./layoutStream');
var log                 = require('../utils/log');
var Context             = require('../models/context');

module.exports = function directiveStream(env, context, node) {
  if (node === undefined) {
    node = {
      id: 'root',
      children: [],
      parent: undefined,
    };
  }

  // Test to see if the current glob pattern will include
  // the source file itself.
  function cyclicDependencyDetected(node, currentPath) {
    var parent;

    while (parent = node.parent) {
      if (parent.id === currentPath) {
        return true;
      }

      node = parent;
    }
  }

  function directiveStreamFn(sourceFile, cb) {
    var stream = null;
    var nextNode = {
      id: sourceFile.path,
      children: [],
      parent: node,
    };

    node.children.push(nextNode);

    if (!context) {
      var contextFilePath = path.relative(env.rootPath, sourceFile.path);

      context = new Context({
        file: contextFilePath,
        template: contextFilePath,
      });
    }

    var fileBaseName = path.basename(sourceFile.path);
    var fileExtensions = fileBaseName.split('.');
    var lastFileExtension = fileExtensions[fileExtensions.length - 1];

    // Check if the last file extension is of a directive typ (html, md, ejs, etc)
    var isBlob = env.directiveFileTypes.indexOf(lastFileExtension) === -1;
    if (!isBlob) {
      var parsedFile = directiveParser(sourceFile.path, sourceFile.contents);
      var patterns = parsedFile.patterns;

      if (cyclicDependencyDetected(node, sourceFile.path)) {
        log.info('[Warning] File is trying to include itself (ignored): "' +
            path.relative(env.rootPath, sourceFile.path + '"'));

        var output;
        if (sourceFile.path.indexOf('.js') > -1) {
          output = '//[lingon] ERROR: Cyclic dependency in "' +
              path.relative(env.rootPath, sourceFile.path) + '"';
        } else {
          output = '';
        }

        cb(null, new File({
          base: path.join(env.rootPath, env.sourcePath),
          path: sourceFile.path,
          contents: new Buffer(output),
        }));

        return;
      }

      var sourceStreams = patterns.map(function (pattern) {
        switch (pattern.type) {
          case 'include_glob':
            var globSource = vfs.src(pattern.args);

            // Recursion: If the current file contained include directives
            // we need to run this stream on their vfs.src streams in case
            // they also contain include directives. This enables support
            // for nested file include dependencies.
            globSource = globSource.pipe(directiveStream(env, null, nextNode));
            return globSource;
          case 'layout':
            var layoutSource = resumer();
            layoutSource.queue(new File({
              base: path.join(env.rootPath, env.sourcePath),
              path: sourceFile.path,
              contents: new Buffer(pattern.args.contents),
            }));
            layoutSource.end();

            layoutSource = layoutSource.pipe(
              layoutStream(env, context, pattern.args.layout)
            );
            return layoutSource;
          case 'include_inline':

            // Each sub-file include is assigned a unique index
            // to be treated as a separate file in the orderedMergeStream
            var index = pattern.index;
            /* falls through */
          case 'include_self':

            // There's no index for include_self
            if (!index) {
              index = '';
            }

            var fileStream = streamHelper.createFromStream(new File({
              base: path.join(env.rootPath, env.sourcePath),
              path: sourceFile.path + index,
              contents: new Buffer(pattern.args.contents),
            }));

            // Pipe preProcessor streams
            // (applied to every included file before concatenation)
            fileStream = preProcess(fileStream);

            return fileStream;
          default:
            throw('DirectiveStream: Unsupported pattern type: ' + pattern.type);
        }
      });

      // Merge the glob streams into one ordered stream
      stream = orderedMergeStream(sourceStreams);

      stream = stream.pipe(es.map(function (file, cb) {
        // Fix file's base for globbed streams
        file.base = path.dirname(sourceFile.path);

        cb(null, file);
      }));

    } else {
      stream = streamHelper.createFromStream(new File({
        base: path.join(env.rootPath, env.sourcePath),
        path: sourceFile.path,
        contents: new Buffer(sourceFile.contents),
      }));

      stream = preProcess(stream);
    }

    if (!isBlob) {
      stream = stream.pipe(concat(path.basename(sourceFile.path)));
    }

    var returnedFile = null;
    stream.on('data', function (file) {
      returnedFile = file;
    });

    stream.on('end', function () {
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
