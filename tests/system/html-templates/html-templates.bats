# Before each spec
setup() {
  # cd to the processors test project
  CWD='tests/system/html-templates'
  cd $CWD
}

@test "html templates: can build angular templates" {
  # Remove existing build/
  if [ -d './build' ]; then
    rm -r ./build 2> /dev/null
  fi

  # Build project
  ./lingon.js build

  # Check that correct output files exist
  diff build/top.js fixtures/top.js
  [ $? -eq 0 ]

  diff build/nested.js fixtures/nested.js
  [ $? -eq 0 ]
}

