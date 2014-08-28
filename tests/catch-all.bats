# Test Lingon catch all feature.

# Before each spec
setup() {
  # cd to the catch all project
  CWD='test/catch-all'
  cd $CWD
}

@test "catch all: non existing paths fall back to catchAll file" {
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

  ${download} tmp/index.html $server/
  ${download} tmp/fallback.html $server/something/that/does/not/exist

  # Terminate server
  kill $LINGON_JOB_PID

  # Did we get everything?
  diff tmp/index.html build/index.html
  [ $? -eq 0 ]

  diff tmp/fallback.html build/index.html
  [ $? -eq 0 ]

  diff tmp/index.html tmp/fallback.html
  [ $? -eq 0 ]
}
