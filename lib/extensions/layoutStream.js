var es                  = require('event-stream');
var File                = require('vinyl');
var path                = require('path');
var vfs                 = require('vinyl-fs');
var directiveParser     = require('../directiveParser');

module.exports = function layoutStream(env, layout) {

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
    
    console.log(layout)    
    var stream = vfs.src(layout);
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

        var contents = body.split("\n");
        contents[yield.args.lineIndex] = file.contents.toString();
        var contents = contents.join("\n");

        console.log(yield.args.lineIndex);
        console.log(body)

        file.contents = new Buffer(contents)
        cb(null, file);
      }else{
        throw("Missing layout!!")
      }
    });
  }

  return es.map(layoutStreamFn);
};