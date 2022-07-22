%module renderer

%insert(header_file) %{
#pragma once
%}

%insert(header_file) %{
#include <type_traits>
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"
#include "renderer/pipeline/custom/RenderInterfaceTypes.h"
%}

%{
#include "bindings/auto/jsb_render_auto.h"
#include "bindings/auto/jsb_scene_auto.h"
#include "bindings/auto/jsb_gfx_auto.h"
#include "bindings/auto/jsb_assets_auto.h"
#include "renderer/pipeline/GeometryRenderer.h"
#include "renderer/pipeline/GlobalDescriptorSetManager.h"
#include "renderer/pipeline/custom/LayoutGraphJsb.h"
#include "renderer/pipeline/custom/RenderCommonJsb.h"
#include "renderer/pipeline/custom/RenderGraphJsb.h"
%}

%include "renderer/pipeline/custom/RenderInterfaceTypes.h"
