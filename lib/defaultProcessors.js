var ejs  = require('gulp-ejs');
var less = require('gulp-less');
var markdown = require('gulp-markdown');
var es = require('event-stream');
var streamHelper = require('./utils/stream');

module.exports = {
  pre: {
    'ejs': [
      {
        filePattern: null,
        pipe: function(global, context) {
          return es.map(function(file, cb) {
            var stream = streamHelper.createFromStream(file);

            var obj = {global: global, context: context};

            stream = stream.pipe(ejs(obj));

            var returnedFile = null;
            stream.on('data', function(file) {
              returnedFile = file;
            });

            stream.on('end', function() {
              cb(null, returnedFile);
            });
          })
        }
      }
    ],
    'md': [
      {
        filePattern: null,
        pipe: function() {
          return markdown()
        }
      }
    ]
  },
  post: {
    'less': [
      {
        filePattern: null,
        pipe: function() {
          return less();
        }
      }
    ]
  }
};
