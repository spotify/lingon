# Before each spec
setup() {
  # cd to the basic test project
  CWD='tests/system/malformed-nested-directives'
  cd $CWD
}

@test "malformed-nested-directives: build finishes and error messages are printed on cyclic dependencies" {
  # Build project
  ./lingon.js build

  diff build/cyclic.js fixtures/cyclic.js
  [ $? -eq 0 ]

  diff build/cyclic.html fixtures/cyclic.html
  [ $? -eq 0 ]

  diff build/strangeloop.js fixtures/strangeloop.js
  [ $? -eq 0 ]
}
