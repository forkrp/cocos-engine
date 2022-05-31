%module(target_namespace="jsb") video

%insert(header_file) %{
#pragma once
%}

%insert(header_file) %{
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"

#include "ui/videoplayer/VideoPlayer.h"

%}

%{
#include "bindings/auto/jsb_video_auto.h"
%}

%include "ui/videoplayer/VideoPlayer.h"
