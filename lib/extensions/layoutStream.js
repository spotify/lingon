var es                  = require('event-stream');
var File                = require('vinyl');
var path                = require('path');
var vfs                 = require('vinyl-fs');
var directiveParser     = require('../directiveParser');
var processorStream     = require('../processorStream');
var streamHelper        = require('../utils/stream');

module.exports = function layoutStream(env, layoutPath) {

  function findYield(patterns, layoutPath) {
    for(var i in patterns) {
      var pattern = patterns[i];
      if(pattern.type == 'yield') {
        return pattern;
      }
    };

    throw("Lingon: LayoutStream: Missing yield in layout file " + layoutPath);
  }

  function findBody(patterns, layoutPath) {
    for(var i in patterns) {
      var pattern = patterns[i];
      if(pattern.type == 'include_self') {
        return pattern;
      }
    }

    throw("Lingon: LayoutStream: Missing file contents in file " + layoutPath);
  }

  function layoutStreamFn(file, cb) {
    var sourcePath = path.join(env.rootPath, env.sourcePath);
    var absoluteLayoutPath = path.resolve(path.join(sourcePath, layoutPath));

    var stream = vfs.src(absoluteLayoutPath);
    var layoutData = null;

    stream.on('data', function(data) {
      layoutData = data.contents.toString();  
    });

    stream.on('end', function() {
      if(!!layoutData) {

        var parsedFile = directiveParser(file.path, layoutData);
        var patterns = parsedFile.patterns;

        var yield = findYield(patterns, file.path);
        var body = findBody(patterns, file.path).args.contents;

        var pStream = streamHelper.createFromStream(new File({
          base: path.dirname(file.path),
          path: file.path,
          contents: new Buffer(file.contents)
        }));

        pStream = pStream.pipe(
          processorStream(
            env.preProcessor,
            env.context,
            env.rootPath,
            env.cache));

        var returnedFile = null;
        pStream.on('data', function(file) {
          returnedFile = file;
        });

        pStream.on('end', function() {
          var filename = path.basename(file.path);
          var newFilename = env.extensionRewriter.transform(filename, [env.preProcessor]);
          returnedFile.path = returnedFile.path.replace(filename, newFilename);

          var contents = body.split("\n");
          contents[yield.args.lineIndex] = returnedFile.contents.toString();
          var contents = contents.join("\n");

          returnedFile.contents = new Buffer(contents);

          cb(null, returnedFile);
        });

      }else{
        throw("Missing layout '" + absoluteLayoutPath + "' included from '" + file.path + "'");
      }
    });
  }

  return es.map(layoutStreamFn);
};