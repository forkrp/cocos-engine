%module renderer

%insert(header_file) %{
#pragma once
%}

%insert(header_file) %{
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"
#include "renderer/GFXDeviceManager.h"
%}

%{
#include "bindings/auto/jsb_pipeline_auto.h"
#include "bindings/auto/jsb_asset_auto.h"
%}


%include "renderer/pipeline/RenderPipeline.h"
%include "renderer/pipeline/forward/ForwardPipeline.h"
