# Test Lingon against the simplest project possible.
# Covers: Building, Concatenating, Serving over http

# Before each spec
setup() {
  # cd to the basic test project
  CWD='test/basic'
  cd $CWD
}

@test "basic project: can build" {
  # Remove existing build/
  if [ -d './build' ]; then
    rm -r ./build 2> /dev/null
  fi

  # Build project
  ./lingon.js build

  # Check that correct output files exist
  [ -f 'build/index.html' ]
  [ -f 'build/index.js' ]
  [ -f 'build/index.css' ]
  [ -f 'build/image.png' ]
  [ -f 'build/lib/lib.js' ]
  [ ! -d 'build/_vendor' ]
}

@test "basic project: can concatenate js files" {
  # Compare the built index.js file to a reference
  # Success if diff exited with status 0

  diff build/index.js fixtures/index.js
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
  ${download} tmp/image.png $server/image.png
  ${download} tmp/lib.js $server/lib/lib.js

  # Terminate server
  kill $LINGON_JOB_PID

  # Did we get everything?
  diff tmp/index.html build/index.html
  [ $? -eq 0 ]

  diff tmp/index.js build/index.js
  [ $? -eq 0 ]

  diff tmp/index.css build/index.css
  [ $? -eq 0 ]

  diff tmp/image.png build/image.png
  [ $? -eq 0 ]

  diff tmp/lib.js build/lib/lib.js
  [ $? -eq 0 ]
}