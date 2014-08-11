var ejs  = require('gulp-ejs');
var less = require('gulp-less');
var markdown = require('gulp-markdown');
var es = require('event-stream');
var streamHelper = require('./utils/stream');

module.exports = {
  pre: {
    'ejs': [
      {
        pathPattern: null,
        pipe: function(context) {
          return es.map(function(file, cb) {
            context.file = {filename: file.filename, path: file.path};

            var stream = streamHelper.createFromStream(file);

            stream = stream.pipe(ejs(context));

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
        pathPattern: null,
        pipe: function() {
          return markdown()
        }
      }
    ]
  },
  post: {
    'less': [
      {
        pathPattern: null,
        pipe: function() {
          return less();
        }
      }
    ]
  }
};
