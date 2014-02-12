var ejs = require('gulp-ejs');
var less = require('gulp-less');

module.exports = {
  pre: {
    'ejs': function(config) {
      return ejs(config);
    }
  },
  post: {
    'less': function() {
      return less();
    }
  }
}