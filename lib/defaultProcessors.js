var ejs = require("gulp-ejs");

module.exports = {
  pre: {
    'ejs': function(config) {
      return ejs(config);
    }
  },
  post: {

  }
}

/*

  pre/post
    process file
      if filename ending matches a pre processor?
        apply processor
        remove matched file ending from filename
        process file
      else
        done!

*/