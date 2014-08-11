#!/bin/bash

# Set up submodule if not already present
git submodule init
git submodule update

# Run all bats tests

if [ $1 ]; 
then
  target=$1
else
  target='test/'
fi

./test/vendor/bats/bin/bats $target
