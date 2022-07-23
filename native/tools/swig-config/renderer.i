%module render

%insert(header_file) %{
#pragma once
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

using namespace cc;
using namespace cc::render;
%}

%attribute(cc::render::PipelineRuntime, cc::gfx::Device*, device, getDevice);
%attribute(cc::render::PipelineRuntime, cc::pipeline::GlobalDSManager *, globalDSManager, getGlobalDSManager);
%attribute(cc::render::PipelineRuntime, cc::gfx::DescriptorSetLayout*, descriptorSetLayout, getDescriptorSetLayout);
%attribute(cc::render::PipelineRuntime, cc::gfx::DescriptorSet *, descriptorSet, getDescriptorSet);
%attribute(cc::render::PipelineRuntime, ccstd::vector<gfx::CommandBuffer*>, commandBuffers, getCommandBuffers);
%attribute(cc::render::PipelineRuntime, cc::pipeline::PipelineSceneData *, pipelineSceneData, getPipelineSceneData);
%attribute(cc::render::PipelineRuntime, ccstd::string&, constantMacros, getConstantMacros);
%attribute(cc::render::PipelineRuntime, cc::scene::Model *, profiler, getProfiler, setProfiler);
%attribute(cc::render::PipelineRuntime, cc::pipeline::GeometryRenderer*, geometryRenderer, getGeometryRenderer);
%attribute(cc::render::PipelineRuntime, float, shadingScale, getShadingScale, setShadingScale);


%attribute(cc::render::SceneVisitor, cc::pipeline::PipelineSceneData*, pipelineSceneData, getPipelineSceneData);
%attribute(cc::render::SceneTask, cc::render::TaskType, taskType, getTaskType);
%attribute(cc::render::Pipeline, cc::render::LayoutGraphBuilder*, layoutGraphBuilder, getLayoutGraphBuilder);

%include "renderer/pipeline/custom/RenderInterfaceTypes.h"
