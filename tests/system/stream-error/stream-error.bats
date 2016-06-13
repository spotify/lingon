# Test Lingon against the simplest project possible.
# Covers: Building, Concatenating, Serving over http

# Before each spec
setup() {
  # cd to the basic test project
  CWD='tests/system/stream-error'
  cd $CWD
}

@test "stream-error: exits with code 0 when all tasks are successful" {
  # Build project
  ./lingon.js clean

  [ $? -eq 0 ]
}

@test "stream-error: exits with code 1 when a task has errors" {
  # Build project
  run ./lingon.js build > /dev/null 2> /dev/null

  [ $status -eq 1 ]
}
