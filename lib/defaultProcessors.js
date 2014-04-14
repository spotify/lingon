var ejs  = require('gulp-ejs');
var less = require('gulp-less');

module.exports = {
  pre: {
    'ejs': [
      {
        pathPattern: null,
        pipe: function(config) {
          return ejs(config);
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
