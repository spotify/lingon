var es                  = require('event-stream');
var File                = require('vinyl');
var path                = require('path');
var vfs                 = require('vinyl-fs');
var streamHelper        = require('../utils/stream');

module.exports = function layoutStream(env, layoutPath) {

  function get_lines(str) {
    return String(str || '').match(/^.*$/gm);
  }

  var YIELD_PATTERN = new RegExp('^\\W*(=|lingon:)\\s*yield\\s*-->?$');
  function findYieldIndex(contents, layoutPath) {
    var lines = get_lines(contents);

    // Find which line the yield is on
    for(var index in lines) {
      var line = lines[index];
      var matches = YIELD_PATTERN.exec(line);
      if(matches) {
        return index;
      }
    }

    throw("Lingon: LayoutStream: Missing yield in layout file " + layoutPath);
  }

  function layoutStreamFn(file, cb) {
    var sourcePath = path.join(env.rootPath, env.sourcePath);
    var absoluteLayoutPath = path.resolve(path.join(sourcePath, layoutPath));

    // Start two streams and run both through the directiveStream
    // 1. Fetch the referenced layout
    // 2. Process the template file

    var layoutStream = vfs.src(absoluteLayoutPath);
    var layoutData = null;

    layoutStream = layoutStream.pipe(env.directiveStream(env));

    layoutStream.on('data', function(data) {
      layoutData = data.contents.toString();  
    });

    layoutStream.on('end', function() {
      if(!layoutData) {
        throw("Missing layout '" + absoluteLayoutPath + "' included from '" + file.path + "'");
      }

      var yieldIndex = findYieldIndex(layoutData, file.path);

      var templateStream = streamHelper.createFromStream(new File({
        base: path.dirname(file.path),
        path: file.path,
        contents: new Buffer(file.contents)
      }));

      templateStream = templateStream.pipe(env.directiveStream(env));

      var returnedFile = null;
      templateStream.on('data', function(file) {
        returnedFile = file;
      });

      templateStream.on('end', function() {
        // Rewrite the filename of template because it has already gone through 
        // the preProcessors. Otherwise it will go through them again in the outer
        // directiveStream pipe.

        var filename = path.basename(file.path);
        var newFilename = env.extensionRewriter.transform(filename, [env.preProcessor]);
        returnedFile.path = returnedFile.path.replace(filename, newFilename);

        var contents = layoutData.split("\n");
        contents[yieldIndex] = returnedFile.contents.toString();
        var contents = contents.join("\n");

        returnedFile.contents = new Buffer(contents);

        cb(null, returnedFile);
      });

    });
  }

  return es.map(layoutStreamFn);
};
