# Test Lingon against the simplest project possible.
# Covers: Building, Concatenating, Serving over http

# Before each spec
setup() {
  # cd to the basic test project
  CWD='tests/system/basic'
  cd $CWD
}

@test "basic project: can build" {
  # Remove existing build/
  if [ -d './build-renamed' ]; then
    rm -r ./build-renamed 2> /dev/null
  fi

  # Build project
  ./lingon.js build

  # Check that correct output files exist
  [ -f 'build-renamed/index.html' ]
  [ -f 'build-renamed/index.js' ]
  [ -f 'build-renamed/index.css' ]
  [ -f 'build-renamed/im age..png' ]
  [ -f 'build-renamed/lib/lib.js' ]
  [ ! -d 'build-renamed/_vendor' ]
}

@test "basic project: can concatenate js files" {
  # Compare the built index.js file to a reference
  # Success if diff exited with status 0

  diff build-renamed/index.js fixtures/index.js
  [ $? -eq 0 ]
}

@test "basic project: can serve files over http" {
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

  ${download} tmp/index.html $server/index.html
  ${download} tmp/index.js $server/index.js
  ${download} tmp/index.css $server/index.css
  ${download} tmp/im\ age..png $server/im%20age..png
  ${download} tmp/lib.js $server/lib/lib.js

  # Terminate server
  kill $LINGON_JOB_PID

  # Did we get everything?
  diff tmp/index.html build-renamed/index.html
  [ $? -eq 0 ]

  diff tmp/index.js build-renamed/index.js
  [ $? -eq 0 ]

  diff tmp/index.css build-renamed/index.css
  [ $? -eq 0 ]

  diff tmp/im\ age..png build-renamed/im\ age..png
  [ $? -eq 0 ]

  diff tmp/lib.js build-renamed/lib/lib.js
  [ $? -eq 0 ]
}
