#!/bin/bash

# exit this script if any commmand fails
set -e

host_os=`uname -s | tr "[:upper:]" "[:lower:]"`

echo $host_os

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export COCOS_NATIVE_ROOT=$( realpath "$DIR/../../" )

echo $COCOS_NATIVE_ROOT


# mac

# SWIG_ROOT=/Users/james/Project/cocos/swig
# export SWIG_EXE=$SWIG_ROOT/build/Release/swig

# linux

SWIG_ROOT=/home/james/projects/swig

# linux release

export SWIG_EXE=$SWIG_ROOT/build/install/bin/swig
export SWIG_LIB=$SWIG_ROOT/build/install/share/swig/4.1.0

# linux debug

# export SWIG_EXE=$SWIG_ROOT/build/swig
# export SWIG_LIB=$SWIG_ROOT/build
# export SWIG_LIB2=$SWIG_ROOT/Lib/javascript/cocos
# export SWIG_LIB3=$SWIG_ROOT/Lib

./lua-${host_os} genbindings.lua
