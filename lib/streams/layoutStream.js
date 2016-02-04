'use strict';

var es                  = require('event-stream');
var File                = require('vinyl');
var path                = require('path');
var vfs                 = require('vinyl-fs');
var Q                   = require('q');

var streamHelper        = require('../utils/stream');
var ExtensionRewriter   = require('../utils/extensionRewriter');
var utils               = require('../utils/utils');

module.exports = function layoutStream(env, context, layoutPath) {

  function getLines(str) {
    return String(str || '').match(/^.*$/gm);
  }

  var YIELD_PATTERN = new RegExp('^\\W*(=|lingon:)\\s*yield\\s*-->?$');
  function findYieldIndex(contents, layoutPath) {
    var lines = getLines(contents);

    // Find which line the yield is on
    for (var index in lines) {
      var line = lines[index];
      var matches = YIELD_PATTERN.exec(line);
      if (matches) {
        return index;
      }
    }

    throw('Lingon: LayoutStream: Missing yield in layout file ' + layoutPath);
  }

  function getLayoutPromise(
      file, templatePath, absoluteLayoutPath, relativeLayoutPath, context) {
    var deferred = Q.defer();

    var layoutStream = vfs.src(absoluteLayoutPath);

    // Rewrite context object for layout
    context.file = relativeLayoutPath;
    context.layout = null;

    layoutStream = layoutStream.pipe(env.directiveStream(env, context));

    var layoutFile = null;

    layoutStream.on('data', function (data) {
      layoutFile = data;
    });

    layoutStream.on('end', function () {
      if (!layoutFile) {
        throw('Missing layout "' + absoluteLayoutPath + '" included from "' +
            file.path + '"');
      }

      deferred.resolve(layoutFile);
    });

    return deferred.promise;
  }

  function getTemplatePromise(file, context) {
    var deferred = Q.defer();

    var templateStream = streamHelper.createFromStream(new File({
      base: path.dirname(file.path),
      path: file.path,
      contents: new Buffer(file.contents),
    }));

    templateStream = templateStream.pipe(env.directiveStream(env, context));

    var returnedFile = null;
    templateStream.on('data', function (file) {
      returnedFile = file;
    });

    templateStream.on('end', function () {
      deferred.resolve(returnedFile);
    });

    return deferred.promise;
  }

  function layoutStreamFn(file, cb) {
    var layoutData;
    var templateFile;

    var sourcePath = path.join(env.rootPath, env.sourcePath);
    var absoluteLayoutPath = path.resolve(path.join(sourcePath, layoutPath));
    var relativeLayoutPath = path.join(env.sourcePath, layoutPath);

    var relativeTemplatePath = path.relative(env.rootPath, file.path);

    //Write layout path to current context
    context.layout = path.relative(env.rootPath, absoluteLayoutPath);

    getTemplatePromise(file, context).then(function (file) {
      templateFile = file;
      return getLayoutPromise(file, relativeTemplatePath, absoluteLayoutPath,
          relativeLayoutPath, context);

    }).then(function (layoutFile) {
      layoutData = layoutFile.contents.toString();

      var filename = path.basename(file.path);
      var extensions = filename.split('.');

      var newFilename = ExtensionRewriter.transform({
        filename: filename,
        extensionMap: utils.getRegisteredExtensions(
          extensions,
          env.extensionMap,
          [env.preProcessors]
        ),
      });

      templateFile.path = templateFile.path.replace(filename, newFilename);

      var yieldIndex = findYieldIndex(layoutData, file.path);

      var contents = layoutData.split('\n');
      contents[yieldIndex] = templateFile.contents.toString();
      contents = contents.join('\n');

      templateFile.contents = new Buffer(contents);

      cb(null, templateFile);
    });

  }

  return es.map(layoutStreamFn);
};
