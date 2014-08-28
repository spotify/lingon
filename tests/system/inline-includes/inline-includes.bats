# Before each spec
setup() {
  # cd to the processors test project
  CWD='tests/system/inline-includes'
  cd $CWD
}

@test "inline includes: inline EJS includes output correct HTML" {
  # Remove existing build/
  if [ -d './build' ]; then
    rm -r ./build 2> /dev/null
  fi

  # Build project
  ./lingon.js build

  # Check that correct output files exist
  diff build/globbed.html fixtures/globbed.html
  [ $? -eq 0 ]

  diff build/markdown.html fixtures/markdown.html
  [ $? -eq 0 ]

  diff build/multiple-edge.html fixtures/multiple-edge.html
  [ $? -eq 0 ]

  diff build/multiple-same.html fixtures/multiple-same.html
  [ $? -eq 0 ]

}

