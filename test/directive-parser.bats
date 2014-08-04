
# Before each spec
setup() {
  CWD='test/directive-parser'
  cd $CWD
}

@test "directive parser: html comments in file header are parsed" {
  # Remove existing build/
  if [ -d './build' ]; then
    rm -r ./build 2> /dev/null
  fi

  # Build project
  ./lingon.js build

  diff build/index.html fixtures/index.html
  [ $? -eq 0 ]
}
