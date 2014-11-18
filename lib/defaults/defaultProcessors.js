var chalk         = require('chalk');
var ejs           = require('gulp-ejs');
var less          = require('gulp-less');
var markdown      = require('gulp-markdown');
var es            = require('event-stream');
var streamHelper  = require('../utils/stream');
var log           = require('../utils/log');

module.exports = {
  pre: {
    'ejs': [
      {
        filePattern: null,
        pipe: function(params) {
          return es.map(function(file, cb) {
            var stream = streamHelper.createFromStream(file);

            var obj = {global: params.global, context: params.context};

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
          lessInstance = less();

          lessInstance.on('error', function(err){
            if(err.message.indexOf("' wasn't found") > -1) {
              log(
                chalk.yellow('The error below usually implies that you´ve used "//= include" on a third-party .less file. Use @import instead.')
              );
            }
          });

          return lessInstance;
        }
      }
    ]
  }
};
