# Test Lingon server namespace feature.

# Before each spec
setup() {
  # cd to the server namespace project
  CWD='tests/system/server-namespace'
  cd $CWD
}

@test "server namespace: folder paths fall back to directoryIndex file" {
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
  server="http://localhost:4567/lingon"
  download="curl --silent -o"

  ${download} tmp/index.html $server/index.html
  ${download} tmp/fallback.html $server/fallback.html

  # Terminate server
  kill $LINGON_JOB_PID

  # Did we get everything?
  diff tmp/index.html source/index.html
  [ $? -eq 0 ]

  diff tmp/fallback.html source/fallback.html
  [ $? -eq 0 ]
}

@test "server namespace: catchAll and directoryIndex still work" {
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

  ${download} tmp/index.html $server/lingon/
  ${download} tmp/fallback.html $server
  ${download} tmp/fallback-lingon.html $server/lingon/something/that/does/not/exist

  # Terminate server
  kill $LINGON_JOB_PID

  # Did we get everything?
  diff tmp/index.html source/index.html
  [ $? -eq 0 ]

  diff tmp/fallback.html source/fallback.html
  [ $? -eq 0 ]

  diff tmp/fallback-lingon.html source/fallback.html
  [ $? -eq 0 ]
}
