%module(target_namespace="n2d") native2d

%insert(header_file) %{
#pragma once
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"
#include "2d/renderer/RenderDrawInfo.h"
#include "2d/renderer/UIMeshBuffer.h"
#include "2d/renderer/Batcher2d.h"
#include "2d/renderer/RenderEntity.h"
#include "2d/renderer/UIModelProxy.h"
%}

%{
#include "bindings/auto/jsb_2d_auto.h"
#include "bindings/auto/jsb_scene_auto.h"
#include "bindings/auto/jsb_gfx_auto.h"
#include "bindings/auto/jsb_assets_auto.h"
%}

%ignore UserData;

%ignore cc::UIMeshBuffer::requireFreeIA;
%ignore cc::UIMeshBuffer::createNewIA;
%ignore cc::UIMeshBuffer::recycleIA;
%ignore cc::UIMeshBuffer::resetIA;
%ignore cc::UIMeshBuffer::parseLayout;
%ignore cc::UIMeshBuffer::getByteOffset;
%ignore cc::UIMeshBuffer::setByteOffset;
%ignore cc::UIMeshBuffer::getVertexOffset;
%ignore cc::UIMeshBuffer::setVertexOffset;
%ignore cc::UIMeshBuffer::getIndexOffset;
%ignore cc::UIMeshBuffer::setIndexOffset;
%ignore cc::UIMeshBuffer::getDirty;
%ignore cc::UIMeshBuffer::setDirty;
%ignore cc::UIMeshBuffer::getFloatsPerVertex;
%ignore cc::UIMeshBuffer::setFloatsPerVertex;
%ignore cc::UIMeshBuffer::getAttributes;

%ignore cc::RenderDrawInfo::getBatcher;
%ignore cc::RenderDrawInfo::setBatcher;
%ignore cc::RenderDrawInfo::parseAttrLayout;
%ignore cc::RenderDrawInfo::getRender2dLayout;
%ignore cc::RenderDrawInfo::getStride;
%ignore cc::RenderDrawInfo::getSize;
%ignore cc::RenderDrawInfo::getEnumDrawInfoType;

%ignore cc::Batcher2d::addVertDirtyRenderer;
%ignore cc::Batcher2d::getMeshBuffer;
%ignore cc::Batcher2d::getDevice;
%ignore cc::Batcher2d::updateDescriptorSet;
%ignore cc::Batcher2d::fillBuffersAndMergeBatches;
%ignore cc::Batcher2d::walk;
%ignore cc::Batcher2d::generateBatch;
%ignore cc::Batcher2d::resetRenderStates;
%ignore cc::Batcher2d::handleDrawInfo;
%ignore cc::Batcher2d::handleComponentDraw;
%ignore cc::Batcher2d::handleModelDraw;
%ignore cc::Batcher2d::handleIADraw;
%ignore cc::Batcher2d::handleSubNode;

%ignore cc::RenderEntity::getDynamicRenderDrawInfo;
%ignore cc::RenderEntity::getDynamicRenderDrawInfos;
%ignore cc::RenderEntity::getRenderEntityType;
%ignore cc::RenderEntity::getColorDirty;
%ignore cc::RenderEntity::getColor;
%ignore cc::RenderEntity::isEnabled;
%ignore cc::RenderEntity::getEnumStencilStage;
%ignore cc::RenderEntity::setEnumStencilStage;
%ignore cc::RenderEntity::getVBColorDirty;
%ignore cc::RenderEntity::setVBColorDirty;

%attribute(cc::UIMeshBuffer, float*, vData, getVData, setVData);
%attribute(cc::UIMeshBuffer, uint16_t*, iData, getIData, setIData);
%attribute(cc::UIMeshBuffer, bool, useLinkData, getUseLinkData, setUseLinkData);

%attribute(cc::RenderDrawInfo, float*, vbBuffer, getVbBuffer, setVbBuffer);
%attribute(cc::RenderDrawInfo, uint16_t*, ibBuffer, getIbBuffer, setIbBuffer);
%attribute(cc::RenderDrawInfo, float*, vDataBuffer, getVDataBuffer, setVDataBuffer);
%attribute(cc::RenderDrawInfo, uint16_t*, iDataBuffer, getIDataBuffer, setIDataBuffer);
%attribute(cc::RenderDrawInfo, cc::Material*, material, getMaterial, setMaterial);
%attribute(cc::RenderDrawInfo, cc::gfx::Texture*, texture, getTexture, setTexture);
%attribute(cc::RenderDrawInfo, cc::gfx::Sampler*, sampler, getSampler, setSampler);
%attribute(cc::RenderDrawInfo, cc::scene::Model*, model, getModel, setModel);
%attribute(cc::RenderDrawInfo, cc::Node*, subNode, getSubNode, setSubNode);

%attribute(cc::RenderEntity, cc::Node*, node, getNode, setNode);
%attribute(cc::RenderEntity, uint32_t, staticDrawInfoSize, getStaticDrawInfoSize, setStaticDrawInfoSize);
%attribute(cc::RenderEntity, uint32_t, stencilStage, getStencilStage, setStencilStage);

%import "base/Macros.h"
%import "base/TypeDef.h"
%import "base/Ptr.h"
%import "base/memory/Memory.h"

%import "renderer/gfx-base/GFXDef-common.h"
%import "renderer/gfx-base/GFXInputAssembler.h"

%import "core/assets/Material.h"
%import "core/scene-graph/Node.h"

%import "2d/renderer/StencilManager.h"
%import "math/Color.h"

%include "2d/renderer/UIMeshBuffer.h"
%include "2d/renderer/RenderDrawInfo.h"
%include "2d/renderer/RenderEntity.h"
%include "2d/renderer/UIModelProxy.h"
%include "2d/renderer/Batcher2d.h"
