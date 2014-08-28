# Test Lingon against the simplest project possible.
# Covers: Building, Concatenating, Serving over http

# Before each spec
setup() {
  # cd to the basic test project
  CWD='test/global'
  cd $CWD
}

@test "global: variables accessible from ejs" {
  # Remove existing build/
  if [ -d './build' ]; then
    rm -r ./build 2> /dev/null
  fi

  # Build project
  ./lingon.js build

  # Compare the built index.js file to a reference
  # Success if diff exited with status 0 

  diff build/index.html fixtures/build.html
  [ $? -eq 0 ]
}

@test "global: it's possible to override variables per task" {
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

  # Terminate server
  kill $LINGON_JOB_PID

  # Did we get everything?
  diff tmp/index.html fixtures/server.html
  [ $? -eq 0 ]
  
}