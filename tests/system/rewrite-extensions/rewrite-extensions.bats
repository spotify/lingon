# Test Lingon against the simplest project possible.
# Covers: Building, Concatenating, Serving over http

# Before each spec
setup() {
  # cd to the rewrite-extensions test project
  CWD='tests/system/rewrite-extensions'
  cd $CWD
}

@test "rewrite-extensions project: built in extensions rewrite properly" {
  # Remove existing build/
  if [ -d './build' ]; then
    rm -r ./build 2> /dev/null
  fi

  # Build project
  ./lingon.js build

  # Check that correct output files exist
  [ -f 'build/index.html' ]
  [ -f 'build/template.js' ]
}

@test "rewrite-extensions project: custom extensions rewrite properly" {
  # Check that correct output files exist
  [ -f 'build/a/b/c.foo' ]
  [ -f 'build/test.foo' ]
}

@test "rewrite-extensions project: does not rewrite deleted rules" {
  [ -f 'build/deleted.normal' ]
  [ ! -f 'build/deleted.rewritten' ]
}

@test "rewrite-extensions project: does not rewrite files without registered processor" {
  [ -f 'build/registered.normal' ]
  [ ! -f 'build/registered.rewritten' ]
}

@test "rewrite-extensions project: multiple segment extensions take precedence" {
  [ -f 'build/lib.js' ]
  [ ! -f 'build/lib.html' ]
}
