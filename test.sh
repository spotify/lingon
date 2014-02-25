#!/bin/bash

# Set up submodule if not already present
git submodule init
git submodule update

# Clean up tmp files
rm -r test/basic/build 2> /dev/null

# Run all bats tests
./test/vendor/bats/bin/bats test/