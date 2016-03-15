'use strict';

var url               = require('url');
var path              = require('path');
var fs                = require('fs');
var log               = require('../utils/log');
var ExtensionRewriter = require('../utils/extensionRewriter');
var buildCallback     = require('./buildCallback');

var dynamicRequestHandlerFactory = function (lingon, ip, port) {

  var pathCache = {};

  var testPath = function (filePath) {
    var sourcePath = path.resolve(
        lingon.rootPath,
        path.join(
          lingon.config.sourcePath,
          filePath
        )
      );

    return fs.existsSync(sourcePath);
  };

  var rewriteRequestPath = function (requestFilePath) {

    // If we don't have a cached path, or if it's no longer valid:
    // let's find it by searching all the possible filenames
    if (!pathCache['CACHE_' + requestFilePath] ||
        !testPath(pathCache['CACHE_' + requestFilePath])) {

      // First, let's test of the file exists on it's own
      if (testPath(requestFilePath)) {
        // Found! Set the file to itself in the cache to speed up next request.
        pathCache['CACHE_' + requestFilePath] = requestFilePath;
        return requestFilePath;
      }

      // Nothing found. Ok, create a list of candidate files to test:
      var candidates = ExtensionRewriter.reverseTransform({
        filename: path.basename(requestFilePath),
        extensionMap: lingon.config.extensionRewrites,
      });

      // Check all candidate files
      var fileExists = false;

      for (var index in candidates) {
        var candidate = path.join(
          path.dirname(requestFilePath), candidates[index]
        );

        // Does the candidate file exist?
        if (testPath(candidate)) {

          // Put the found file in the cache for faster access next time
          pathCache['CACHE_' + requestFilePath] = path.relative(
            path.join(lingon.rootPath),
            candidate
          );

          fileExists = true;

          // We found a file! No need to keep looking.
          break;
        }
      }

      // The file does not exist, let the server handle the 404.
      if (!fileExists) {
        return requestFilePath;
      }
    }

    return pathCache['CACHE_' + requestFilePath];
  };

  var requestHandler = function (request, response, next) {
    var requestPath = url.parse(request.url);

    // Serve directoryIndex if requestPath ends with a slash (directory)
    if (requestPath.pathname.substr(-1, 1) === '/') {
      requestPath = url.parse(requestPath.pathname +
          lingon.config.server.directoryIndex);
    }

    // Remove the slash and decode URI safe strings
    requestPath = decodeURIComponent(requestPath.pathname.substring(1));

    // Rewrite the requested path to the corresponding source file
    requestPath = rewriteRequestPath(requestPath);

    // Run lingon for the requested file
    lingon.build({
      callback: buildCallback(request, response, next),
      requestPath: requestPath,
      targetPath: ip + ':' + port,
      pipelineTerminators: [],
    });
  };

  return requestHandler;
};

module.exports = dynamicRequestHandlerFactory;
