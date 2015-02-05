# Test Lingon against the simplest project possible.
# Covers: Building, Concatenating, Serving over http

# Before each spec
setup() {
  # cd to the basic test project
  CWD='tests/system/reserved-keyword-urls'
  cd $CWD
}

@test "reserved keyword urls: files that are named with reserved JS keywords are built" {
  # Remove existing build/
  if [ -d './build' ]; then
    rm -r ./build 2> /dev/null
  fi

  # Build project
  ./lingon.js build

  diff build/constructor fixtures/constructor
  [ $? -eq 0 ]

  diff build/toString fixtures/toString
  [ $? -eq 0 ]

  diff build/js/hasOwnProperty fixtures/hasOwnProperty
  [ $? -eq 0 ]
}

@test "reserved keyword urls: can serve files named with reserved keywords over http" {
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

  ${download} tmp/constructor $server/constructor
  ${download} tmp/toString $server/toString
  ${download} tmp/hasOwnProperty $server/js/hasOwnProperty

  # Terminate server
  kill $LINGON_JOB_PID

  # Did we get everything?
  diff tmp/constructor fixtures/constructor
  [ $? -eq 0 ]

  diff tmp/toString fixtures/toString
  [ $? -eq 0 ]

  diff tmp/hasOwnProperty fixtures/hasOwnProperty
  [ $? -eq 0 ]

}

