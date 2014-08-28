#!/bin/bash

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

echo "Running unit tests"
./node_modules/tape/bin/tape tests/unit/*

echo "Running system tests"
./tests/vendor/bats/bin/bats $target
