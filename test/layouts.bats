# Before each spec
setup() {
  # cd to the processors test project
  CWD='test/layouts'
  cd $CWD
}

@test "layouts: html/ejs files can render inside layouts" {
  # Remove existing build/
  if [ -d './build' ]; then
    rm -r ./build 2> /dev/null
  fi

  # Build project
  ./lingon.js build

  # Check that correct output files exist
  diff build/home.html fixtures/home.html
  [ $? -eq 0 ]


}

@test "layouts: md files can render inside layouts" {
  diff build/article.html fixtures/article.html
  [ $? -eq 0 ]
}

@test "layouts: layouts can be referenced with absolute path (relative to sourcePath)" {
  diff build/sub/folder/absolute.html fixtures/sub/folder/absolute.html
  [ $? -eq 0 ]
}

