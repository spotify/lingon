setup() {
  CWD='test/basic'
  cd $CWD
}

@test "basic project: starts clean" {
  [ ! -d 'build' ]
}

@test "basic project: builds" {
  # Build project
  ./ojfile.js build

  # Check that correct output files exist
  [ -f 'build/index.js' ] &&
  [ -f 'build/index.css' ] &&
  [ -f 'build/lib/lib.js' ] &&
  [ ! -d 'build/_vendor' ]
}

@test "basic project: concatenates js files" {
  # Compare the built index.js file to a reference
  diff build/index.js fixtures/index.js
  
  [ $? -eq 0 ]
}