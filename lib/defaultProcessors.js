module.exports = {
  pre: {
    '.ejs': {

    },
    '.ngt': {

    },
    '.less': {

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