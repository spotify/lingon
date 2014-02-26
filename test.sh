#!/bin/bash

# Set up submodule if not already present
git submodule init
git submodule update

# Run all bats tests
./test/vendor/bats/bin/bats test/