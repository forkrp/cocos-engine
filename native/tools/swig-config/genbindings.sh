#!/bin/bash

# exit this script if any commmand fails
set -e

host_os=`uname -s | tr "[:upper:]" "[:lower:]"`

echo $host_os

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

function abspath() { pushd . > /dev/null; if [ -d "$1" ]; then cd "$1"; dirs -l +0; else cd "`dirname \"$1\"`"; cur_dir=`dirs -l +0`; if [ "$cur_dir" == "/" ]; then echo "$cur_dir`basename \"$1\"`"; else echo "$cur_dir/`basename \"$1\"`"; fi; fi; popd > /dev/null; }

export COCOS_NATIVE_ROOT=$( abspath "$DIR/../../" )

echo $COCOS_NATIVE_ROOT

# mac

if [ "$host_os" == "darwin" ]; then
    # release
    SWIG_ROOT=$COCOS_NATIVE_ROOT/external/mac/bin/swig
    export SWIG_EXE=$SWIG_ROOT/bin/swig
    export SWIG_LIB=$SWIG_ROOT/share/swig/4.1.0

    # debug
    # SWIG_ROOT=/Users/james/Project/cocos/swig
    # export SWIG_EXE=$SWIG_ROOT/build/Release/swig
    # export SWIG_LIB=$SWIG_ROOT/build
    # export SWIG_LIB2=$SWIG_ROOT/Lib/javascript/cocos
    # export SWIG_LIB3=$SWIG_ROOT/Lib
fi

# linux

if [ "$host_os" == "linux" ]; then
    # release
    SWIG_ROOT=$COCOS_NATIVE_ROOT/external/mac/bin/swig
    export SWIG_EXE=$SWIG_ROOT/bin/swig
    export SWIG_LIB=$SWIG_ROOT/share/swig/4.1.0

    # debug
    # SWIG_ROOT=/home/james/projects/swig
    # export SWIG_EXE=$SWIG_ROOT/build/swig
    # export SWIG_LIB=$SWIG_ROOT/build
    # export SWIG_LIB2=$SWIG_ROOT/Lib/javascript/cocos
    # export SWIG_LIB3=$SWIG_ROOT/Lib
fi

./lua-${host_os} genbindings.lua
