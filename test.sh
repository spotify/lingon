#!/bin/bash
set -e

# Set up submodule if not already present
git submodule init
git submodule update

# Run all bats tests

if [ $1 ];
then
  target=$1
else
  target='tests/system/*'
fi

echo "Running code style test (jscs)"
./node_modules/.bin/jscs lib/ --reporter=inline

echo "Running unit tests"
./node_modules/.bin/tape tests/unit/*

echo "Running system tests"
./tests/vendor/bats/bin/bats $target
