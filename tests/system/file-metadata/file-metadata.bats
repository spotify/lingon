# Before each spec
setup() {
  # cd to the processors test project
  CWD='tests/system/file-metadata'
  cd $CWD
}

@test "file metadata: can attach metadata to file before EJS rendering" {
  # Remove existing build/
  if [ -d './build' ]; then
    rm -r ./build 2> /dev/null
  fi

  # Build project
  ./lingon.js build

  # Check that correct output files exist
  diff build/article.html fixtures/article.html
  [ $? -eq 0 ]

  diff build/nested.html fixtures/nested.html
  [ $? -eq 0 ]
}