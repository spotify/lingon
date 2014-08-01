var ejs  = require('gulp-ejs');
var less = require('gulp-less');

module.exports = {
  pre: {
    'ejs': [
      {
        pathPattern: null,
        pipe: function(context) {
          return ejs(context);
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
