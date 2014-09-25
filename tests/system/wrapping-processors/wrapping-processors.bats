# Test Lingon against the simplest project possible.
# Covers: Custom processors, alternate processor syntax

# Before each spec
setup() {
  # cd to the processors test project
  CWD='tests/system/wrapping-processors'
  cd $CWD
}

@test "wrapping-processors: preProcessors can wrap files correctly" {
  # Remove existing build/
  if [ -d './build' ]; then
    rm -r ./build 2> /dev/null
  fi

  # Build project
  ./lingon.js build

  diff build/modules.js fixtures/modules.js
  [ $? -eq 0 ]

}
