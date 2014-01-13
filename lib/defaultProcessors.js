var ejs = require('gulp-ejs');
var less = require('gulp-less');

module.exports = {
  pre: {
    'ejs': function(config) {
      return {
        name: 'gulp-ejs',
        stream: ejs(config)
      }
    }
  },
  post: {
    'less': function() {
      return {
        name: 'gulp-less',
        stream: less({
        //paths: [ path.join(__dirname, 'less', 'includes') ]
        })
      }
    }
  }
}