%module gfx

// %inline %{
// struct Size final {
//     float width;
//     float height;
// };
// %}

// %inline %{
//     class Hello final {
//     public:
//         static void foo();
//     };
// %}

%insert(header_file) %{
#pragma once

#include <type_traits>
#include "cocos/bindings/jswrapper/SeApi.h"
#include "cocos/bindings/manual/jsb_conversions.h"
#include "cocos/renderer/GFXDeviceManager.h"
%}

%{
#include "cocos/bindings/auto/jsb_gfx_auto.h"
%}

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
%ignore DescriptorSetLayout::getBindingIndices;
%ignore DescriptorSetLayout::descriptorIndices;
%ignore DescriptorSetLayout::getDescriptorIndices;

%ignore CommandBuffer::execute;
%ignore CommandBuffer::updateBuffer;
%ignore CommandBuffer::copyBuffersToTexture;

%ignore Device::copyBuffersToTexture;
%ignore Device::copyTextureToBuffers;

%ignore FormatInfo;

}}

%import "base/Macros.h"
%import "base/memory/Memory.h"
// %import "base/RefCounted.h"

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

/*
skip = Buffer::[Buffer initialize update],
       CommandBuffer::[CommandBuffer execute updateBuffer copyBuffersToTexture],
       Framebuffer::[Framebuffer],
       InputAssembler::[InputAssembler],
       DescriptorSet::[DescriptorSet],
       DescriptorSetLayout::[DescriptorSetLayout getBindingIndices descriptorIndices getDescriptorIndices],
       PipelineLayout::[PipelineLayout],
       PipelineState::[PipelineState],
       Queue::[Queue],
       QueryPool::[QueryPool],
       RenderPass::[RenderPass getColorAttachments getBindings getBindingIndices],
       Shader::[Shader],
       Swapchain::[Swapchain],
       Texture::[Texture initialize getRaw],
       Sampler::[Sampler],
       GeneralBarrier::[GeneralBarrier],
       TextureBarrier::[TextureBarrier],
       Device::[Device copyBuffersToTexture copyTextureToBuffers createBuffer createTexture getInstance setRendererAvailable isRendererAvailable]


getter_setter = Device::[gfxAPI deviceName memoryStatus queue commandBuffer renderer vendor numDrawCalls numInstances numTris capabilities],
                Shader::[name stages attributes blocks samplers],
                Texture::[info viewInfo width height format size hash],
                Queue::[type],
                RenderPass::[hash],
                DescriptorSet::[layout],
                PipelineState::[shader primitive bindPoint inputState rasterizerState depthStencilState blendState renderPass],
                InputAssembler::[vertexBuffers attributes indexBuffer indirectBuffer attributesHash drawInfo vertexCount firstVertex indexCount firstIndex vertexOffset instanceCount firstInstance],
                Commanduffer::[type queue numDrawCalls numInstances numTris],
                Framebuffer::[renderPass colorTextures depthStencilTexture],
                Buffer::[usage memUsage stride count size flags],
                Sampler::[info],
                Swapchain::[width height surfaceTransform colorTexture depthStencilTexture],
                GFXObject::[objectType objectID typedID]

rename_functions = DepthStencilState::[getHash=hash],
                   BlendState::[getHash=hash],
                   RasterizerState::[getHash=hash]
*/