var ejs = require('gulp-ejs');
var less = require('gulp-less');

module.exports = {
  pre: {
    'ejs': function(config) {
      return {
        name: 'ejs',
        stream: ejs(config)
      }
    }
    // 'less': function() {
    //   return less({
    //     //paths: [ path.join(__dirname, 'less', 'includes') ]
    //   })
    // }
  },
  post: {

  }
}