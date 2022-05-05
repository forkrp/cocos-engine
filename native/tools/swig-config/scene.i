%module(target_namespace="jsb") scene

%insert(header_file) %{
#pragma once
%}

%insert(header_file) %{
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"

#include "core/Root.h"
#include "core/scene-graph/Node.h"
#include "core/scene-graph/Scene.h"
#include "core/scene-graph/SceneGlobals.h"
#include "scene/Light.h"
#include "scene/Fog.h"
#include "scene/Shadow.h"
#include "scene/Skybox.h"
#include "scene/DirectionalLight.h"
#include "scene/SpotLight.h"
#include "scene/SphereLight.h"
#include "scene/Model.h"
#include "scene/SubModel.h"
#include "scene/Pass.h"
#include "scene/RenderScene.h"
#include "scene/DrawBatch2D.h"
#include "scene/RenderWindow.h"
#include "scene/Camera.h"
#include "scene/Define.h"
#include "scene/Ambient.h"
#include "renderer/core/PassInstance.h"
#include "renderer/core/MaterialInstance.h"
#include "3d/models/MorphModel.h"
#include "3d/models/SkinningModel.h"
#include "3d/models/BakedSkinningModel.h"

#include "renderer/core/ProgramLib.h"
#include "scene/Octree.h"
%}

%{
#include "bindings/auto/jsb_scene_auto.h"
#include "bindings/auto/jsb_gfx_auto.h"
#include "bindings/auto/jsb_pipeline_auto.h"
#include "bindings/auto/jsb_geometry_auto.h"
#include "bindings/auto/jsb_assets_auto.h"
#include "bindings/auto/jsb_render_auto.h"
%}

%ignore cc::Node::setRTSInternal;
%ignore cc::Node::setRTS;
%ignore cc::scene::Camera::syncCameraEditor;
//FIXME: These methods binding code will generate SwigValueWrapper type which is not supported now.
%ignore cc::scene::Model::getLocalData; 
%ignore cc::JointTexturePool::getDefaultPoseTexture;
//
%ignore cc::Layers::addLayer;
%ignore cc::Layers::deleteLayer;
%ignore cc::Layers::nameToLayer;
%ignore cc::Layers::layerToName;

//TODO: %attribute code needs to be generated from ts file automatically.
%attribute(cc::Root, cc::gfx::Device*, device, getDevice, setDevice);
%attribute(cc::Root, cc::gfx::Device*, _device, getDevice, setDevice);
%attribute(cc::Root, cc::scene::RenderWindow*, mainWindow, getMainWindow);
%attribute(cc::Root, cc::scene::RenderWindow*, curWindow, getCurWindow, setCurWindow);
%attribute(cc::Root, cc::scene::RenderWindow*, tempWindow, getTempWindow, setTempWindow);
%attribute(cc::Root, %arg(ccstd::vector<IntrusivePtr<cc::scene::RenderWindow>> &), windows, getWindows);
%attribute(cc::Root, %arg(ccstd::vector<IntrusivePtr<cc::scene::RenderScene>> &), scenes, getScenes);
%attribute(cc::Root, float, cumulativeTime, getCumulativeTime);
%attribute(cc::Root, float, frameTime, getFrameTime);
%attribute(cc::Root, uint32_t, frameCount, getFrameCount);
%attribute(cc::Root, uint32_t, fps, getFps);
%attribute(cc::Root, uint32_t, fixedFPS, getFixedFPS, setFixedFPS);
%attribute(cc::Root, bool, useDeferredPipeline, isUsingDeferredPipeline);
%attribute(cc::Root, cc::render::PipelineRuntime *, pipeline, getPipeline);

%attribute(cc::scene::RenderWindow, uint32_t, width, getWidth);
%attribute(cc::scene::RenderWindow, uint32_t, height, getHeight);
%attribute(cc::scene::RenderWindow, cc::gfx::Framebuffer*, framebuffer, getFramebuffer);
%attribute(cc::scene::RenderWindow, %arg(ccstd::vector<IntrusivePtr<Camera>> &), cameras, getCameras);
%attribute(cc::scene::RenderWindow, cc::gfx::Swapchain*, swapchain, getSwapchain);

%attribute(cc::scene::Pass, cc::Root*, root, getRoot);
%attribute(cc::scene::Pass, cc::gfx::Device*, device, getDevice);
%attribute(cc::scene::Pass, cc::IProgramInfo*, shaderInfo, getShaderInfo);
%attribute(cc::scene::Pass, cc::gfx::DescriptorSetLayout*, localSetLayout, getLocalSetLayout);
%attribute(cc::scene::Pass, ccstd::string&, program, getProgram);
%attribute(cc::scene::Pass, %arg(Record<ccstd::string, cc::IPropertyInfo> &), properties, getProperties);
%attribute(cc::scene::Pass, cc::MacroRecord&, defines, getDefines);
%attribute(cc::scene::Pass, index_t, passIndex, getPassIndex);
%attribute(cc::scene::Pass, index_t, propertyIndex, getPropertyIndex);
%attribute(cc::scene::Pass, cc::scene::IPassDynamics &, dynamics, getDynamics);
%attribute(cc::scene::Pass, bool, rootBufferDirty, isRootBufferDirty); 
%attribute(cc::scene::Pass, bool, _rootBufferDirty, isRootBufferDirty, _setRootBufferDirty);
%attribute(cc::scene::Pass, cc::pipeline::RenderPriority, priority, getPriority);
%attribute(cc::scene::Pass, cc::gfx::PrimitiveMode, primitive, getPrimitive);
%attribute(cc::scene::Pass, cc::pipeline::RenderPassStage, stage, getStage);
%attribute(cc::scene::Pass, uint32_t, phase, getPhase);
%attribute(cc::scene::Pass, cc::gfx::RasterizerState *, rasterizerState, getRasterizerState);
%attribute(cc::scene::Pass, cc::gfx::DepthStencilState *, depthStencilState, getDepthStencilState);
%attribute(cc::scene::Pass, cc::gfx::BlendState *, blendState, getBlendState);
%attribute(cc::scene::Pass, cc::gfx::DynamicStateFlagBit, dynamicStates, getDynamicStates);
%attribute(cc::scene::Pass, cc::scene::BatchingSchemes, batchingScheme, getBatchingScheme);
%attribute(cc::scene::Pass, cc::gfx::DescriptorSet *, descriptorSet, getDescriptorSet);
%attribute(cc::scene::Pass, uint32_t, hash, getHash);
%attribute(cc::scene::Pass, cc::gfx::PipelineLayout*, pipelineLayout, getPipelineLayout);

%attribute(cc::PassInstance, scene::Pass*, parent, getParent);

%attribute(cc::Node, ccstd::string &, uuid, getUuid);
%attribute(cc::Node, float, angle, getAngle, setAngle);
%attribute_writeonly(cc::Node, Mat4&, matrix, setMatrix);
%attribute(cc::Node, uint32_t, hasChangedFlags, getChangedFlags, setChangedFlags);
%attribute(cc::Node, bool, active, isActive, setActive);
%attribute(cc::Node, bool, _persistNode, isPersistNode, setPersistNode);
%attribute(cc::Node, uint32_t, _dirtyFlags, getDirtyFlag, setDirtyFlag);

%attribute(cc::scene::Ambient, cc::Vec4&, skyColor, getSkyColor, setSkyColor);
%attribute(cc::scene::Ambient, float, skyIllum, getSkyIllum, setSkyIllum);
%attribute(cc::scene::Ambient, Vec4&, groundAlbedo, getGroundAlbedo, setGroundAlbedo);
%attribute(cc::scene::Ambient, bool, enabled, isEnabled, setEnabled);
%attribute(cc::scene::Ambient, uint8_t, mipmapCount, getMipmapCount, setMipmapCount);

%attribute(cc::scene::Light, bool, baked, isBaked, setBaked);
%attribute(cc::scene::Light, Vec3&, color, getColor, setColor);
%attribute(cc::scene::Light, bool, useColorTemperature, isUseColorTemperature, setUseColorTemperature);
%attribute(cc::scene::Light, float, colorTemperature, getColorTemperature, setColorTemperature);
%attribute(cc::scene::Light, cc::Node*, node, getNode, setNode);
%attribute(cc::scene::Light, cc::scene::LightType, type, getType, setType);
%attribute(cc::scene::Light, ccstd::string&, name, getName, setName);
%attribute(cc::scene::Light, cc::scene::RenderScene*, scene, getScene);

%attribute(cc::scene::DirectionalLight, Vec3&, direction, getDirection, setDirection);
%attribute(cc::scene::DirectionalLight, float, illuminance, getIlluminance, setIlluminance);
%attribute(cc::scene::DirectionalLight, float, illuminanceHDR, getIlluminanceHDR, setIlluminanceHDR);
%attribute(cc::scene::DirectionalLight, float, illuminanceLDR, getIlluminanceLDR, setIlluminanceLDR);
%attribute(cc::scene::DirectionalLight, bool, shadowEnabled, isShadowEnabled, setShadowEnabled);
%attribute(cc::scene::DirectionalLight, float, shadowPcf, getShadowPcf, setShadowPcf);
%attribute(cc::scene::DirectionalLight, float, shadowBias, getShadowBias, setShadowBias);
%attribute(cc::scene::DirectionalLight, float, shadowNormalBias, getShadowNormalBias, setShadowNormalBias);
%attribute(cc::scene::DirectionalLight, float, shadowSaturation, getShadowSaturation, setShadowSaturation);
%attribute(cc::scene::DirectionalLight, float, shadowDistance, getShadowDistance, setShadowDistance);
%attribute(cc::scene::DirectionalLight, float, shadowInvisibleOcclusionRange, getShadowInvisibleOcclusionRange, setShadowInvisibleOcclusionRange);
%attribute(cc::scene::DirectionalLight, bool, shadowFixedArea, isShadowFixedArea, setShadowFixedArea);
%attribute(cc::scene::DirectionalLight, float, shadowNear, getShadowNear, setShadowNear);
%attribute(cc::scene::DirectionalLight, float, shadowFar, getShadowFar, setShadowFar);
%attribute(cc::scene::DirectionalLight, float, shadowOrthoSize, getShadowOrthoSize, setShadowOrthoSize);

%attribute(cc::scene::SpotLight, Vec3&, position, getPosition);
%attribute(cc::scene::SpotLight, float, range, getRange, setRange);
%attribute(cc::scene::SpotLight, float, luminance, getLuminance, setLuminance);
%attribute(cc::scene::SpotLight, float, luminanceHDR, getLuminanceHDR, setLuminanceHDR);
%attribute(cc::scene::SpotLight, float, luminanceLDR, getLuminanceLDR, setLuminanceLDR);
%attribute(cc::scene::SpotLight, Vec3&, direction, getDirection);
%attribute(cc::scene::SpotLight, float, spotAngle, getSpotAngle, setSpotAngle);
%attribute(cc::scene::SpotLight, float, angle, getAngle);
%attribute(cc::scene::SpotLight, float, aspect, getAspect, setAspect);
%attribute(cc::scene::SpotLight, cc::geometry::AABB&, aabb, getAABB);
%attribute(cc::scene::SpotLight, cc::geometry::Frustum &, frustum, getFrustum, setFrustum);
%attribute(cc::scene::SpotLight, bool, shadowEnabled, isShadowEnabled, setShadowEnabled);
%attribute(cc::scene::SpotLight, float, shadowPcf, getShadowPcf, setShadowPcf);
%attribute(cc::scene::SpotLight, float, shadowBias, getShadowBias, setShadowBias);
%attribute(cc::scene::SpotLight, float, shadowNormalBias, getShadowNormalBias, setShadowNormalBias);
%attribute(cc::scene::SpotLight, float, size, getSize, setSize);

%attribute(cc::scene::SphereLight, Vec3&, position, getPosition, setPosition);
%attribute(cc::scene::SphereLight, float, size, getSize, setSize);
%attribute(cc::scene::SphereLight, float, range, getRange, setRange);
%attribute(cc::scene::SphereLight, float, luminance, getLuminance, setLuminance);
%attribute(cc::scene::SphereLight, float, luminanceHDR, getLuminanceHDR, setLuminanceHDR);
%attribute(cc::scene::SphereLight, float, luminanceLDR, getLuminanceLDR, setLuminanceLDR);
%attribute(cc::scene::SphereLight, cc::geometry::AABB&, aabb, getAABB);

%attribute(cc::scene::Camera, cc::Scene::CameraISO, iso, getIso, setIso);
%attribute(cc::scene::Camera, float, isoValue, getIsoValue, setIsoValue);
%attribute(cc::scene::Camera, float, ec, getEc, setEc);
%attribute(cc::scene::Camera, float, exposure, getExposure);
%attribute(cc::scene::Camera, cc::Scene::CameraShutter, shutter, getShutter, setShutter);
%attribute(cc::scene::Camera, float, shutterValue, getShutterValue, setShutterValue);
%attribute(cc::scene::Camera, float, apertureValue, getApertureValue, setApertureValue);
%attribute(cc::scene::Camera, uint32_t, width, getWidth);
%attribute(cc::scene::Camera, uint32_t, height, getHeight);
%attribute(cc::scene::Camera, float, aspect, getAspect);
%attribute(cc::scene::Camera, cc::Mat4&, matView, getMatView);
%attribute(cc::scene::Camera, cc::Mat4&, matProj, getMatProj);
%attribute(cc::scene::Camera, cc::Mat4&, matProjInv, getMatProjInv);
%attribute(cc::scene::Camera, cc::Mat4&, matViewProj, getMatViewProj);
%attribute(cc::scene::Camera, cc::Mat4&, matViewProjInv, getMatViewProjInv);
%attribute(cc::scene::Camera, cc::scene::RenderScene*, scene, getScene);
%attribute(cc::scene::Camera, ccstd::string&, name, getName);
%attribute(cc::scene::Camera, cc::scene::RenderWindow*, window, getWindow, setWindow);
%attribute(cc::scene::Camera, cc::Vec3&, forward, getForward, setForward);
%attribute(cc::scene::Camera, cc::scene::CameraAperture, aperture, getAperture, setAperture);
%attribute(cc::scene::Camera, cc::Vec3&, position, getPosition, setPosition);
%attribute(cc::scene::Camera, cc::scene::CameraProjection, projectionType, getProjectionType, setProjectionType);
%attribute(cc::scene::Camera, cc::scene::CameraFOVAxis, fovAxis, getFovAxis, setFovAxis);
%attribute(cc::scene::Camera, float, fov, getFov, setFov);
%attribute(cc::scene::Camera, float, nearClip, getNearClip, setNearClip);
%attribute(cc::scene::Camera, float, farClip, getFarClip, setFarClip);
/*
RenderScene::[name cameras? mainLight? sphereLights? spotLights? models],
Skybox::[model enabled/isEnabled/setEnabled useIBL/isUseIBL/setUseIBL isRGBE/isRGBE/setRGBE envmap],
Fog::[enabled/isEnabled/setEnabled fogColor type fogDensity fogStart fogEnd fogAtten fogTop fogRange fogRange colorArray],
Model::[scene _subModels:subModels/getSubModels inited/isInited _localDataUpdated/isLocalDataUpdated/setLocalDataUpdated
 _worldBounds:worldBounds/getWorldBounds/setWorldBounds _modelBounds:modelBounds/getModelBounds/setModelBounds 
 worldBoundBuffer localBuffer updateStamp isInstancingEnabled/isInstancingEnabled 
 receiveShadow/isReceiveShadow/setReceiveShadow castShadow/isCastShadow/setCastShadow 
 node transform visFlags enabled/isEnabled/setEnabled type instancedAttributes/getInstancedAttributeBlock/setInstancedAttributeBlock 
 isDynamicBatching/isDynamicBatching/setDynamicBatching],
*/

%attribute(cc::scene::Camera, cc::Vec4&, viewport, getViewport, setViewport);
%attribute(cc::scene::Camera, float, orthoHeight, getOrthoHeight, setOrthoHeight);
%attribute(cc::scene::Camera, cc::gfx::Color&, clearColor, getClearColor, setClearColor);
%attribute(cc::scene::Camera, float, clearDepth, getClearDepth, setClearDepth);
%attribute(cc::scene::Camera, cc::gfx::ClearFlagBit, clearFlag, getClearFlag, setClearFlag);
%attribute(cc::scene::Camera, float, clearStencil, getClearStencil, setClearStencil);
%attribute(cc::scene::Camera, bool, enabled, isEnabled, setEnabled);
%attribute(cc::scene::Camera, float, exposure, getExposure);
%attribute(cc::scene::Camera, cc::geometry::Frustum, frustum, getFrustum, setFrustum);
%attribute(cc::scene::Camera, bool, isWindowSize, isWindowSize, setWindowSize);
%attribute(cc::scene::Camera, uint32_t, priority, getPriority, setPriority);
%attribute(cc::scene::Camera, float, screenScale, getScreenScale, setScreenScale);
%attribute(cc::scene::Camera, uint32_t, visibility, getVisibility, setVisibility);
%attribute(cc::scene::Camera, cc::Node*, node, getNode, setNode);
%attribute(cc::scene::Camera, cc::gfx::SurfaceTransform, surfaceTransform, getSurfaceTransform);
%attribute(cc::scene::Camera, cc::pipeline::GeometryRenderer *, geometryRenderer, getGeometryRenderer);


%import "base/Macros.h"
%import "base/TypeDef.h"
%import "base/memory/Memory.h"
%import "base/Ptr.h"

%import "core/ArrayBuffer.h"
%import "core/data/Object.h"
%import "core/TypedArray.h"

%import "math/MathBase.h"
%import "math/Vec2.h"
%import "math/Vec3.h"
%import "math/Vec4.h"
%import "math/Color.h"
%import "math/Mat3.h"
%import "math/Mat4.h"
%import "math/Quaternion.h"

// %import "renderer/gfx-base/GFXDef-common.h"
%import "core/data/Object.h"
%import "renderer/pipeline/RenderPipeline.h"
%import "renderer/core/PassUtils.h"
%import "scene/Define.h"

%import "core/assets/Asset.h"
%import "core/assets/TextureBase.h"
%import "core/assets/SimpleTexture.h"
%import "core/assets/Texture2D.h"
%import "core/assets/TextureCube.h"
%import "core/assets/RenderTexture.h"
%import "core/assets/BufferAsset.h"
%import "core/assets/EffectAsset.h"
%import "core/assets/ImageAsset.h"
%import "core/assets/SceneAsset.h"
%import "core/assets/TextAsset.h"
%import "core/assets/Material.h"
%import "core/assets/RenderingSubMesh.h"

%import "core/geometry/Enums.h"
%import "core/geometry/AABB.h"
%import "core/geometry/Capsule.h"
// %import "core/geometry/Curve.h"
%import "core/geometry/Distance.h"
%import "core/geometry/Frustum.h"
// %import "core/geometry/Intersect.h"
%import "core/geometry/Line.h"
%import "core/geometry/Obb.h"
%import "core/geometry/Plane.h"
%import "core/geometry/Ray.h"
%import "core/geometry/Spec.h"
%import "core/geometry/Sphere.h"
%import "core/geometry/Spline.h"
%import "core/geometry/Triangle.h"
%import "3d/assets/Skeleton.h"

%include "core/scene-graph/NodeEnum.h"
%include "core/scene-graph/Layers.h"
%include "core/scene-graph/BaseNode.h"
%include "core/scene-graph/Node.h"
%include "core/scene-graph/Scene.h"
%include "core/scene-graph/SceneGlobals.h"
%include "core/Root.h"
%include "core/animation/SkeletalAnimationUtils.h"
%include "3d/skeletal-animation/SkeletalAnimationUtils.h"

%include "scene/Define.h"
%include "scene/Light.h"
%include "scene/Fog.h"
%include "scene/Shadow.h"
%include "scene/Skybox.h"
%include "scene/DirectionalLight.h"
%include "scene/SpotLight.h"
%include "scene/SphereLight.h"
%include "scene/Model.h"
%include "scene/SubModel.h"
%include "scene/Pass.h"
%include "scene/RenderScene.h"
%include "scene/DrawBatch2D.h"
%include "scene/RenderWindow.h"
%include "scene/Camera.h"
%include "scene/Ambient.h"
%include "renderer/core/PassInstance.h"
%include "renderer/core/MaterialInstance.h"

%import "3d/assets/Morph.h"
%include "3d/models/MorphModel.h"
%include "3d/models/SkinningModel.h"
%include "3d/models/BakedSkinningModel.h"

%include "renderer/core/ProgramLib.h"
%include "scene/Octree.h"

