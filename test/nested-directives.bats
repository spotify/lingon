# Before each spec
setup() {
  # cd to the basic test project
  CWD='test/nested-directives'
  cd $CWD
}

@test "nested directives: can parse nested include directives in correct order" {
  # Build project
  ./lingon.js build

  diff build/a.js fixtures/a.js
  [ $? -eq 0 ]
}

@test "nested directives: can build non-directive files" {
  diff build/test.txt fixtures/test.txt
  [ $? -eq 0 ]
}
