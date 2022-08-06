#!/bin/bash

# exit this script if any commmand fails
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
COCOS_NATIVE_ROOT=$( realpath "$DIR/../../" )

echo $COCOS_NATIVE_ROOT

SWIG_ROOT=/Users/james/projects/cocos-creator/swig
export PATH=$SWIG_ROOT/build:$SWIG_ROOT/build/Debug:$PATH
export SWIG_LIB=$SWIG_ROOT/Lib

# Array pretending to be a Pythonic dictionary
ARRAY=( 
	"2d.i:jsb_2d_auto.cpp"
    "assets.i:jsb_assets_auto.cpp"
    "audio.i:jsb_audio_auto.cpp"
    "cocos.i:jsb_cocos_auto.cpp"
    "dragonbones.i:jsb_dragonbones_auto.cpp"
    "editor_support.i:jsb_editor_support_auto.cpp"
    "extension.i:jsb_extension_auto.cpp"
    "geometry.i:jsb_geometry_auto.cpp"
    "gfx.i:jsb_gfx_auto.cpp"
    "network.i:jsb_network_auto.cpp"
    "physics.i:jsb_physics_auto.cpp"
    "pipeline.i:jsb_pipeline_auto.cpp"
    "scene.i:jsb_scene_auto.cpp"
    "spine.i:jsb_spine_auto.cpp"
    "webview.i:jsb_webview_auto.cpp"
    "video.i:jsb_video_auto.cpp"
    "renderer.i:jsb_render_auto.cpp"
)

for animal in "${ARRAY[@]}" ; do
    KEY="${animal%%:*}"
    VALUE="${animal##*:}"
    # printf "%s likes to %s.\n" "$KEY" "$VALUE"
    swig -c++ -cocos -fvirtual -noexcept -cpperraswarn -D__clang__ -Dfinal= -DCC_PLATFORM=3 -Dconstexpr=const -DCC_PLATFORM_ANDROID=3 \
    -I$SWIG_ROOT/build -I$COCOS_NATIVE_ROOT -I$COCOS_NATIVE_ROOT/cocos \
    -o $COCOS_NATIVE_ROOT/cocos/bindings/auto/$VALUE $COCOS_NATIVE_ROOT/tools/swig-config/$KEY
done
