#!/bin/bash

# exit this script if any commmand fails
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export COCOS_NATIVE_ROOT=$( realpath "$DIR/../../" )

echo $COCOS_NATIVE_ROOT

export SWIG_ROOT=/Users/james/projects/cocos-creator/swig
export PATH=$SWIG_ROOT/build:$SWIG_ROOT/build/Debug:$PATH
export SWIG_LIB=$SWIG_ROOT/Lib

./lua genbindings.lua
