# Test Lingon against the simplest project possible.
# Covers: Building, Concatenating, Serving over http

# Before each spec
setup() {
  CWD='tests/system/stream-error2'
  cd $CWD
}

@test "stream-error2: exits with code 2 on uncaughtException" {
  # Build project
  run ./lingon.js build > /dev/null 2> /dev/null

  [ $status -eq 2 ]
}
