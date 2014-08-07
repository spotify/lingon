var ejs  = require('gulp-ejs');
var less = require('gulp-less');
var markdown = require('gulp-markdown');

module.exports = {
  pre: {
    'ejs': [
      {
        pathPattern: null,
        pipe: function(context) {
          return ejs(context);
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
