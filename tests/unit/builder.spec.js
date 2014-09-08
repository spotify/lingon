var test            = require('tape');
var Builder         = require('../../lib/builder');
var SourceFile      = require('../../lib/models/sourceFile');


test("Builder.createPipeline execute transform functions in correct order", function(t) {
  
  var sourceFile = new SourceFile({
      name: 'dummy.js',
      path: '.'
  });

  sourceFile.meta = '';

  var transform = function(str) {
    return function(sourceFile) {
      sourceFile.meta += str;
      return sourceFile;
    };
  };

  sourceFile = Builder.createPipeline(
    sourceFile,
    transform('A'),
    transform('B'),
    transform('C')
  )

  t.equals(sourceFile.meta, "ABC");
  t.end();
})