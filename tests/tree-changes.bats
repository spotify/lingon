# Before each spec
setup() {
  # cd to the tree changes project
  CWD='test/tree-changes'
  cd $CWD
}

@test "tree changes: server returns correct response when adding, deleting and renaming files" {
  # Remove existing build/
  if [ -d './build' ]; then
    rm -r ./build 2> /dev/null
  fi

  # Remove existing tmp/
  if [ -d './tmp' ]; then
    rm -r ./tmp 2> /dev/null
  fi

  # Create tmp/
  mkdir ./tmp

  # Remove existing source/
  if [ -d './source' ]; then
    rm -r ./source 2> /dev/null
  fi

  # Create source/
  mkdir ./source

  # Populate source/ content
  cp ./fixtures/*.html ./source/
  # don't add late-added-file.html just yet
  rm ./source/late-added-file.html

  # Start the http server
  LINGON_JOB="./lingon.js server -p 4567"
  eval ${LINGON_JOB} > /dev/null &
  LINGON_JOB_PID=`ps ax | grep -e "${LINGON_JOB}" | grep -v grep | awk '{print $1}'`

  # Wait a while
  sleep 2

  # Get some files
  server="http://localhost:4567"
  download="curl --silent -o"

  ${download} tmp/late-added-file-before.html $server/late-added-file.html
  ${download} tmp/late-removed-file-before.html $server/late-removed-file.html
  ${download} tmp/late-renamed-file-before.html $server/late-renamed-file.html
  ${download} tmp/late-renamed-file-old-name-before.html $server/late-renamed-file.html
  ${download} tmp/late-renamed-file-new-name-before.html $server/renamed-file.html

  cp ./fixtures/late-added-file.html ./source/late-added-file.html
  ${download} tmp/late-added-file-after.html $server/late-added-file.html
  rm ./source/late-removed-file.html
  ${download} tmp/late-removed-file-after.html $server/late-removed-file.html
  mv ./source/late-renamed-file.html ./source/renamed-file.html
  ${download} tmp/late-renamed-file-old-name-after.html $server/late-renamed-file.html
  ${download} tmp/late-renamed-file-new-name-after.html $server/renamed-file.html

  # Terminate server
  kill $LINGON_JOB_PID

  # Did we get everything?
  diff tmp/late-added-file-before.html fixtures/error404.html
  [ $? -eq 0 ]

  diff tmp/late-added-file-after.html fixtures/late-added-file.html
  [ $? -eq 0 ]

  diff tmp/late-removed-file-before.html fixtures/late-removed-file.html
  [ $? -eq 0 ]

  diff tmp/late-removed-file-after.html fixtures/error404.html
  [ $? -eq 0 ]

  diff tmp/late-renamed-file-old-name-before.html fixtures/late-renamed-file.html
  [ $? -eq 0 ]

  diff tmp/late-renamed-file-old-name-after.html fixtures/error404.html
  [ $? -eq 0 ]

  diff tmp/late-renamed-file-new-name-before.html fixtures/error404.html
  [ $? -eq 0 ]

  diff tmp/late-renamed-file-new-name-after.html fixtures/late-renamed-file.html
  [ $? -eq 0 ]
}

