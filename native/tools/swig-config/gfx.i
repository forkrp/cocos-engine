%module gfx

%insert(header_file) %{
#pragma once
%}

%insert(header_file) %{
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"
#include "renderer/GFXDeviceManager.h"
%}

%{
#include "bindings/auto/jsb_gfx_auto.h"
%}

// Device
%attribute(cc::gfx::Device, cc::gfx::API, gfxAPI, getGfxAPI);
%attribute(cc::gfx::Device, ccstd::string&, deviceName, getDeviceName);
%attribute(cc::gfx::Device, cc::gfx::MemoryStatus&, memoryStatus, getMemoryStatus);
%attribute(cc::gfx::Device, cc::gfx::Queue*, queue, getQueue);
%attribute(cc::gfx::Device, cc::gfx::CommandBuffer*, commandBuffer, getCommandBuffer);
%attribute(cc::gfx::Device, ccstd::string&, renderer, getRenderer);
%attribute(cc::gfx::Device, ccstd::string&, vendor, getVendor);
%attribute(cc::gfx::Device, uint32_t, numDrawCalls, getNumDrawCalls);
%attribute(cc::gfx::Device, uint32_t, numInstances, getNumInstances);
%attribute(cc::gfx::Device, uint32_t, numTris, getNumTris);
%attribute(cc::gfx::Device, cc::gfx::DeviceCaps&, capabilities, getCapabilities);

// Shader
%attribute(cc::gfx::Shader, ccstd::string&, name, getName);
%attribute(cc::gfx::Shader, cc::gfx::ShaderStageList&, stages, getStages);
%attribute(cc::gfx::Shader, cc::gfx::AttributeList&, attributes, getAttributes);
%attribute(cc::gfx::Shader, cc::gfx::UniformBlockList&, blocks, getBlocks);
%attribute(cc::gfx::Shader, cc::gfx::UniformSamplerList&, samplers, getSamplers);

// Texture
%attribute(cc::gfx::Texture, cc::gfx::TextureInfo&, info, getInfo);
%attribute(cc::gfx::Texture, cc::gfx::TextureViewInfo&, viewInfo, getViewInfo);
%attribute(cc::gfx::Texture, uint32_t, width, getWidth);
%attribute(cc::gfx::Texture, uint32_t, height, getHeight);
%attribute(cc::gfx::Texture, cc::gfx::Format, format, getFormat);
%attribute(cc::gfx::Texture, uint32_t, size, getSize);
%attribute(cc::gfx::Texture, ccstd::hash_t, hash, getHash);

// Queue
%attribute(cc::gfx::Queue, cc::gfx::QueueType, type, getType);

// RenderPass
%attribute(cc::gfx::RenderPass, ccstd::hash_t, hash, getHash);

// DescriptorSet
%attribute(cc::gfx::DescriptorSet, cc::gfx::DescriptorSetLayout*, layout, getLayout);

// PipelineState
%attribute(cc::gfx::PipelineState, cc::gfx::Shader*, shader, getShader);
%attribute(cc::gfx::PipelineState, cc::gfx::PrimitiveMode, primitive, getPrimitive);
%attribute(cc::gfx::PipelineState, cc::gfx::PipelineBindPoint, bindPoint, getBindPoint);
%attribute(cc::gfx::PipelineState, cc::gfx::InputState&, inputState, getInputState);
%attribute(cc::gfx::PipelineState, cc::gfx::RasterizerState&, rasterizerState, getRasterizerState);
%attribute(cc::gfx::PipelineState, cc::gfx::DepthStencilState&, depthStencilState, getDepthStencilState);
%attribute(cc::gfx::PipelineState, cc::gfx::BlendState&, blendState, getBlendState);
%attribute(cc::gfx::PipelineState, cc::gfx::RenderPass*, renderPass, getRenderPass);

// InputAssembler
%attribute(cc::gfx::InputAssembler, cc::gfx::BufferList&, vertexBuffers, getVertexBuffers);
%attribute(cc::gfx::InputAssembler, cc::gfx::AttributeList&, attributes, getAttributes);
%attribute(cc::gfx::InputAssembler, cc::gfx::Buffer*, indexBuffer, getIndexBuffer);
%attribute(cc::gfx::InputAssembler, cc::gfx::Buffer*, indirectBuffer, getIndirectBuffer);
%attribute(cc::gfx::InputAssembler, uint32_t, attributesHash, getAttributesHash);

%attribute(cc::gfx::InputAssembler, cc::gfx::DrawInfo&, drawInfo, getDrawInfo, setDrawInfo);
%attribute(cc::gfx::InputAssembler, uint32_t, vertexCount, getVertexCount, setVertexCount);
%attribute(cc::gfx::InputAssembler, uint32_t, firstVertex, getFirstVertex, setFirstVertex);
%attribute(cc::gfx::InputAssembler, uint32_t, indexCount, getIndexCount, setIndexCount);
%attribute(cc::gfx::InputAssembler, uint32_t, firstIndex, getFirstIndex, setFirstIndex);
%attribute(cc::gfx::InputAssembler, uint32_t, vertexOffset, getVertexOffset, setVertexOffset);
%attribute(cc::gfx::InputAssembler, uint32_t, instanceCount, getInstanceCount, setInstanceCount);

// CommandBuffer
%attribute(cc::gfx::CommandBuffer, cc::gfx::CommandBufferType, type, getType);
%attribute(cc::gfx::CommandBuffer, cc::gfx::Queue*, queue, getQueue);
%attribute(cc::gfx::CommandBuffer, uint32_t, numDrawCalls, getNumDrawCalls);
%attribute(cc::gfx::CommandBuffer, uint32_t, numInstances, getNumInstances);
%attribute(cc::gfx::CommandBuffer, uint32_t, numTris, getNumTris);

// Framebuffer
%attribute(cc::gfx::Framebuffer, cc::gfx::RenderPass*, renderPass, getRenderPass);
%attribute(cc::gfx::Framebuffer, cc::gfx::TextureList&, colorTextures, getColorTextures);
%attribute(cc::gfx::Framebuffer, cc::gfx::Texture*, depthStencilTexture, getDepthStencilTexture);

// Buffer
%attribute(cc::gfx::Buffer, cc::gfx::BufferUsage, usage, getUsage);
%attribute(cc::gfx::Buffer, cc::gfx::MemoryUsage, memUsage, getMemUsage);
%attribute(cc::gfx::Buffer, uint32_t, stride, getStride);
%attribute(cc::gfx::Buffer, uint32_t, count, getCount);
%attribute(cc::gfx::Buffer, uint32_t, size, getSize);
%attribute(cc::gfx::Buffer, cc::gfx::BufferFlags, flags, getFlags);

// Sampler
%attribute(cc::gfx::Sampler, cc::gfx::SamplerInfo&, info, getInfo);
%attribute(cc::gfx::Sampler, ccstd::hash_t, hash, getHash);

// Swapchain
%attribute(cc::gfx::Swapchain, uint32_t, width, getWidth);
%attribute(cc::gfx::Swapchain, uint32_t, height, getHeight);
%attribute(cc::gfx::Swapchain, cc::gfx::SurfaceTransform, surfaceTransform, getSurfaceTransform);
%attribute(cc::gfx::Swapchain, cc::gfx::Texture*, colorTexture, getColorTexture);
%attribute(cc::gfx::Swapchain, cc::gfx::Texture*, depthStencilTexture, getDepthStencilTexture);

// GFXObject
%attribute(cc::gfx::GFXObject, cc::gfx::ObjectType, objectType, getObjectType);
%attribute(cc::gfx::GFXObject, uint32_t, objectID, getObjectID);
%attribute(cc::gfx::GFXObject, uint32_t, typedID, getTypedID);

namespace cc { namespace gfx {

// TODO(cjh): use regex to ignore
%ignore TextureInfo::_padding;
%ignore TextureViewInfo::_padding;
%ignore ColorAttachment::_padding;
%ignore DepthStencilAttachment::_padding;
%ignore SubpassDependency::_padding;
%ignore BufferInfo::_padding;

%ignore Buffer::initialize;
%ignore Buffer::update;

%ignore CommandBuffer::execute;
%ignore CommandBuffer::updateBuffer;
%ignore CommandBuffer::copyBuffersToTexture;
%rename(drawWithInfo) CommandBuffer::draw(const DrawInfo&);

%ignore DescriptorSetLayout::getBindingIndices;
%ignore DescriptorSetLayout::descriptorIndices;
%ignore DescriptorSetLayout::getDescriptorIndices;

%ignore CommandBuffer::execute;
%ignore CommandBuffer::updateBuffer;
%ignore CommandBuffer::copyBuffersToTexture;

%ignore Device::copyBuffersToTexture;
%ignore Device::copyTextureToBuffers;

%ignore FormatInfo;

}} // namespace cc { namespace gfx {

%import "base/Macros.h"
%import "base/memory/Memory.h"

%include "renderer/gfx-base/GFXDef-common.h"
%include "renderer/gfx-base/GFXObject.h"
%include "renderer/gfx-base/GFXBuffer.h"
%include "renderer/gfx-base/GFXCommandBuffer.h"
%include "renderer/gfx-base/GFXDescriptorSet.h"
%include "renderer/gfx-base/GFXDescriptorSetLayout.h"
%include "renderer/gfx-base/GFXFramebuffer.h"
%include "renderer/gfx-base/GFXInputAssembler.h"
%include "renderer/gfx-base/GFXPipelineLayout.h"
%include "renderer/gfx-base/GFXPipelineState.h"
%include "renderer/gfx-base/GFXQueryPool.h"
%include "renderer/gfx-base/GFXQueue.h"
%include "renderer/gfx-base/GFXRenderPass.h"
%include "renderer/gfx-base/GFXShader.h"
%include "renderer/gfx-base/GFXSwapchain.h"
%include "renderer/gfx-base/GFXTexture.h"

%include "renderer/gfx-base/states/GFXGeneralBarrier.h"
%include "renderer/gfx-base/states/GFXSampler.h"
%include "renderer/gfx-base/states/GFXTextureBarrier.h"

%include "renderer/gfx-base/GFXDevice.h"

%include "renderer/GFXDeviceManager.h"
