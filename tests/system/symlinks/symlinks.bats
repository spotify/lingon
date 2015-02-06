# Test Lingon against the simplest project possible.
# Covers: Building, Concatenating, Serving over http

# Before each spec
setup() {
  # cd to the basic test project
  CWD='tests/system/symlinks'
  cd $CWD
}

@test "symlinks: can build" {
  # Remove existing build/
  if [ -d './build' ]; then
    rm -r ./build 2> /dev/null
  fi

  # Build project
  ./lingon.js build

  # Check that correct output files exist
  [ -f 'build/symlinked-file.css' ]
  [ -f 'build/symlinked-folder/empty.css' ]
  [ -f 'build/symlinked-folder/vendor.css' ]
}

@test "symlinks: can serve files over http" {
  # Remove existing tmp/
  if [ -d './tmp' ]; then
    rm -r ./tmp 2> /dev/null
  fi

  # Create tmp/
  mkdir ./tmp

  # Start the http server
  LINGON_JOB="./lingon.js server -p 4567"
  eval ${LINGON_JOB} > /dev/null &
  LINGON_JOB_PID=`ps ax | grep -e "${LINGON_JOB}" | grep -v grep | awk '{print $1}'`

  # Wait a while
  sleep 2

  # Get some files
  server="http://localhost:4567"
  download="curl --silent -o"

  ${download} tmp/symlinked-file.css $server/symlinked-file.css
  ${download} tmp/symlinked-folder-empty.css $server/symlinked-folder/empty.css
  ${download} tmp/symlinked-folder-vendor.css $server/symlinked-folder/vendor.css

  # Terminate server
  kill $LINGON_JOB_PID

  # Did we get everything?
  diff tmp/symlinked-file.css build/symlinked-file.css
  [ $? -eq 0 ]

  diff tmp/symlinked-folder-empty.css build/symlinked-folder/empty.css
  [ $? -eq 0 ]

  diff tmp/symlinked-folder-vendor.css build/symlinked-folder/vendor.css
  [ $? -eq 0 ]
}
