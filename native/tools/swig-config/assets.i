%module(target_namespace="jsb") assets

%insert(header_file) %{
#pragma once
%}

%insert(header_file) %{
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"

#include "core/assets/Asset.h"
#include "core/assets/BufferAsset.h"
#include "core/assets/EffectAsset.h"
#include "core/assets/ImageAsset.h"
#include "core/assets/Material.h"
#include "core/builtin/BuiltinResMgr.h"
#include "3d/assets/Morph.h"
#include "3d/assets/Mesh.h"
#include "3d/assets/Skeleton.h"
%}

%{
#include "bindings/auto/jsb_assets_auto.h"
#include "bindings/auto/jsb_cocos_auto.h"
#include "bindings/auto/jsb_gfx_auto.h"

#include "renderer/core/PassUtils.h"
#include "renderer/gfx-base/GFXDef-common.h"
#include "renderer/pipeline/Define.h"
#include "renderer/pipeline/RenderStage.h"
#include "scene/Pass.h"
#include "core/scene-graph/Scene.h"
%}

namespace cc {
%ignore Asset::createNode; //FIXME: swig needs to support std::function
%ignore BufferAsset::getBuffer;
%ignore IMemoryImageSource::data;
%ignore SimpleTexture::uploadDataWithArrayBuffer;
%ignore Mesh::copyAttribute; //TODO:
%ignore Mesh::copyIndices;//TODO:
%ignore SceneAsset::setScene;
}

%import "base/Macros.h"
%import "base/TypeDef.h"
%import "base/Ptr.h"
%import "base/memory/Memory.h"

%import "core/Types.h"
%import "core/data/Object.h"
%import "core/scene-graph/Node.h"
%import "core/TypedArray.h"
%import "core/assets/AssetEnum.h"

%import "renderer/gfx-base/GFXDef-common.h"
%import "renderer/gfx-base/GFXTexture.h"
%import "renderer/pipeline/Define.h"
%import "renderer/pipeline/RenderStage.h"
%import "renderer/core/PassUtils.h"

%import "math/MathBase.h"
%import "math/Vec2.h"
%import "math/Vec3.h"
%import "math/Vec4.h"
%import "math/Color.h"
%import "math/Mat3.h"
%import "math/Mat4.h"
%import "math/Quaternion.h"

%include "3d/assets/Types.h"
%include "primitive/PrimitiveDefine.h"
%include "core/assets/Asset.h"
%include "core/assets/TextureBase.h"
%include "core/assets/SimpleTexture.h"
%include "core/assets/Texture2D.h"
%include "core/assets/BufferAsset.h"
%include "core/assets/EffectAsset.h"
%include "core/assets/ImageAsset.h"
%include "core/assets/SceneAsset.h"
%include "core/assets/TextAsset.h"
%include "core/assets/Material.h"
%include "core/builtin/BuiltinResMgr.h"
%include "3d/assets/Morph.h"
%include "3d/assets/Mesh.h"
%include "3d/assets/Skeleton.h"
