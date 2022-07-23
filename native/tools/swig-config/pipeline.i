%module(target_namespace="nr") pipeline

%insert(header_file) %{
#pragma once
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"
#include "renderer/pipeline/forward/ForwardPipeline.h"
#include "renderer/pipeline/forward/ForwardFlow.h"
#include "renderer/pipeline/forward/ForwardStage.h"
#include "renderer/pipeline/shadow/ShadowFlow.h"
#include "renderer/pipeline/shadow/ShadowStage.h"
#include "renderer/pipeline/shadow/CSMLayers.h"
#include "renderer/pipeline/GlobalDescriptorSetManager.h"
#include "renderer/pipeline/InstancedBuffer.h"
#include "renderer/pipeline/deferred/DeferredPipeline.h"
#include "renderer/pipeline/deferred/MainFlow.h"
#include "renderer/pipeline/deferred/GbufferStage.h"
#include "renderer/pipeline/deferred/LightingStage.h"
#include "renderer/pipeline/deferred/BloomStage.h"
#include "renderer/pipeline/deferred/PostProcessStage.h"
#include "renderer/pipeline/PipelineSceneData.h"
#include "renderer/pipeline/BatchedBuffer.h"
#include "renderer/pipeline/GeometryRenderer.h"
%}

%{
#include "bindings/auto/jsb_pipeline_auto.h"
#include "bindings/auto/jsb_scene_auto.h"
#include "bindings/auto/jsb_gfx_auto.h"
#include "renderer/pipeline/PipelineUBO.h"

using namespace cc;
%}

%ignore cc::pipeline::convertQueueSortFunc;
%ignore cc::pipeline::RenderPipeline::getFrameGraph;
%ignore cc::pipeline::PipelineSceneData::getRenderObjects;
%ignore cc::pipeline::PipelineSceneData::setRenderObjects;
%ignore cc::pipeline::PipelineSceneData::getShadowObjects;
%ignore cc::pipeline::PipelineSceneData::setShadowObjects;
%ignore cc::pipeline::PipelineSceneData::getShadowFramebufferMap;
%ignore cc::pipeline::PipelineSceneData::getCSMLayers;
%ignore cc::pipeline::PipelineSceneData::getCSMSupported;
%ignore cc::pipeline::PipelineSceneData::setCSMSupported;
%ignore cc::pipeline::UBOBloom;

//TODO: Use regex to write the following ignore pattern
%ignore cc::pipeline::RenderPipeline::fgStrHandleOutDepthTexture;
%ignore cc::pipeline::RenderPipeline::fgStrHandleOutColorTexture;
%ignore cc::pipeline::RenderPipeline::fgStrHandlePostprocessPass;
%ignore cc::pipeline::RenderPipeline::fgStrHandleBloomOutTexture;

%ignore cc::pipeline::ForwardPipeline::fgStrHandleForwardColorTexture;
%ignore cc::pipeline::ForwardPipeline::fgStrHandleForwardDepthTexture;
%ignore cc::pipeline::ForwardPipeline::fgStrHandleForwardPass;

%ignore cc::pipeline::DeferredPipeline::fgStrHandleGbufferTexture;
%ignore cc::pipeline::DeferredPipeline::fgStrHandleGbufferPass;
%ignore cc::pipeline::DeferredPipeline::fgStrHandleLightingPass;
%ignore cc::pipeline::DeferredPipeline::fgStrHandleTransparentPass;
%ignore cc::pipeline::DeferredPipeline::fgStrHandleSsprPass;

%ignore cc::pipeline::CSMLayers::update;
%ignore cc::pipeline::CSMLayers::getCastShadowObjects;
%ignore cc::pipeline::CSMLayers::setCastShadowObjects;
%ignore cc::pipeline::CSMLayers::addCastShadowObject;
%ignore cc::pipeline::CSMLayers::clearCastShadowObjects;
%ignore cc::pipeline::CSMLayers::getLayerObjects;
%ignore cc::pipeline::CSMLayers::setLayerObjects;
%ignore cc::pipeline::CSMLayers::addLayerObject;
%ignore cc::pipeline::CSMLayers::clearLayerObjects;
%ignore cc::pipeline::CSMLayers::getLayers;
%ignore cc::pipeline::CSMLayers::getSpecialLayer;

%attribute(cc::pipeline::RenderPipeline, cc::pipeline::GlobalDSManager*, globalDSManager, getGlobalDSManager);
%attribute(cc::pipeline::RenderPipeline, cc::gfx::DescriptorSet*, descriptorSet, getDescriptorSet);
%attribute(cc::pipeline::RenderPipeline, cc::gfx::DescriptorSetLayout*, descriptorSetLayout, getDescriptorSetLayout);
%attribute(cc::pipeline::RenderPipeline, ccstd::string&, constantMacros, getConstantMacros);

%attribute(cc::pipeline::RenderPipeline, bool, clusterEnabled, isClusterEnabled, setClusterEnabled);
%attribute(cc::pipeline::RenderPipeline, bool, bloomEnabled, isBloomEnabled, setBloomEnabled);
%attribute(cc::pipeline::RenderPipeline, cc::pipeline::PipelineSceneData*, pipelineSceneData, getPipelineSceneData);
%attribute(cc::pipeline::RenderPipeline, cc::pipeline::GeometryRenderer*, geometryRenderer, getGeometryRenderer);
%attribute(cc::pipeline::RenderPipeline, cc::scene::Model*, profiler, getProfiler, setProfiler);
%attribute(cc::pipeline::RenderPipeline, float, shadingScale, getShadingScale, setShadingScale);


%attribute(cc::pipeline::PipelineSceneData, bool, isHDR, isHDR, setHDR);
%attribute(cc::pipeline::PipelineSceneData, float, shadingScale, getShadingScale, setShadingScale);
%attribute(cc::pipeline::PipelineSceneData, cc::scene::Fog*, fog, getFog);
%attribute(cc::pipeline::PipelineSceneData, cc::scene::Ambient*, ambient, getAmbient);
%attribute(cc::pipeline::PipelineSceneData, cc::scene::Skybox*, skybox, getSkybox);
%attribute(cc::pipeline::PipelineSceneData, cc::scene::Shadows*, shadows, getShadows);

%attribute(cc::pipeline::BloomStage, float, threshold, getThreshold, setThreshold);
%attribute(cc::pipeline::BloomStage, float, intensity, getIntensity, setIntensity);
%attribute(cc::pipeline::BloomStage, int, iterations, getIterations, setIterations);



#define CC_USE_GEOMETRY_RENDERER 1

%import "base/Macros.h"
%import "base/TypeDef.h"
%import "base/memory/Memory.h"
%import "base/Ptr.h"

%import "math/MathBase.h"
%import "math/Vec2.h"
%import "math/Vec3.h"
%import "math/Vec4.h"
%import "math/Color.h"
%import "math/Mat3.h"
%import "math/Mat4.h"
%import "math/Quaternion.h"

%import "core/assets/Material.h"

%import "renderer/gfx-base/GFXDef-common.h"
%import "renderer/core/PassUtils.h"

%include "renderer/pipeline/Define.h"

%include "renderer/pipeline/RenderPipeline.h"
%include "renderer/pipeline/RenderFlow.h"
%include "renderer/pipeline/RenderStage.h"

%include "renderer/pipeline/forward/ForwardPipeline.h"
%include "renderer/pipeline/forward/ForwardFlow.h"
%include "renderer/pipeline/forward/ForwardStage.h"

%include "renderer/pipeline/shadow/ShadowFlow.h"
%include "renderer/pipeline/shadow/ShadowStage.h"
%include "renderer/pipeline/shadow/CSMLayers.h"

%include "renderer/pipeline/GlobalDescriptorSetManager.h"
%include "renderer/pipeline/InstancedBuffer.h"
%include "renderer/pipeline/deferred/DeferredPipeline.h"
%include "renderer/pipeline/deferred/MainFlow.h"
%include "renderer/pipeline/deferred/GbufferStage.h"
%include "renderer/pipeline/deferred/LightingStage.h"
%include "renderer/pipeline/deferred/BloomStage.h"
%include "renderer/pipeline/deferred/PostProcessStage.h"
%include "renderer/pipeline/PipelineSceneData.h"
%include "renderer/pipeline/BatchedBuffer.h"
%include "renderer/pipeline/GeometryRenderer.h"

