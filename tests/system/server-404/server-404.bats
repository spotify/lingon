# Test Lingon server fallback feature.

# Before each spec
setup() {
  # cd to the server 404 project
  CWD='tests/system/server-404'
  cd $CWD
}

@test "server 404: correctly replies with 404 when file not found" {
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

  ${download} tmp/something.html $server/does/not/exist/something.html

  # Terminate server
  kill $LINGON_JOB_PID

  # Did we get everything?
  diff tmp/something.html fixtures/404.html
  [ $? -eq 0 ]
}