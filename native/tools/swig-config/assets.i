%module(target_namespace="jsb") assets

%insert(header_file) %{
#pragma once
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
#include "3d/misc/CreateMesh.h"
%}

%{
#include "bindings/auto/jsb_assets_auto.h"
#include "bindings/auto/jsb_cocos_auto.h"
#include "bindings/auto/jsb_gfx_auto.h"
#include "bindings/auto/jsb_scene_auto.h"
#include "renderer/core/PassUtils.h"
#include "renderer/gfx-base/GFXDef-common.h"
#include "renderer/pipeline/Define.h"
#include "renderer/pipeline/RenderStage.h"
#include "scene/Pass.h"
#include "scene/RenderWindow.h"
#include "core/scene-graph/Scene.h"
%}


%rename(cpp_keyword_struct) cc::Mesh::ICreateInfo::structInfo;
%rename(cpp_keyword_switch) cc::IPassInfoFull::switch_;
%rename(cpp_keyword_register) cc::EffectAsset::registerAsset;

%rename(_getProperty) cc::Material::getProperty;
%rename(_propsInternal) cc::Material::_props;

%rename(_getBindposes) cc::Skeleton::getBindposes;
%rename(_setBindposes) cc::Skeleton::setBindposes;

%rename(_data) cc::IMemoryImageSource::data;
%rename(_compressed) cc::IMemoryImageSource::compressed;

%rename(buffer) cc::BufferAsset::getBuffer;

namespace cc {
%ignore Asset::createNode; //FIXME: swig needs to support std::function
// %ignore IMemoryImageSource::data;
%ignore SimpleTexture::uploadDataWithArrayBuffer;
%ignore TextureCube::_mipmaps;
// %ignore Mesh::copyAttribute; //TODO:
// %ignore Mesh::copyIndices;//TODO:
%ignore Material::setProperty;
%ignore ImageAsset::setData;
}

%attribute(cc::Asset, ccstd::string&, _uuid, getUuid, setUuid);
%attribute(cc::Asset, ccstd::string, nativeUrl, getNativeUrl);
%attribute(cc::Asset, cc::NativeDep, _nativeDep, getNativeDep);
%attribute(cc::Asset, bool, isDefault, isDefault);

%attribute(cc::ImageAsset, cc::PixelFormat, format, getFormat, setFormat);
%attribute(cc::ImageAsset, ccstd::string&, url, getUrl, setUrl);

%attribute(cc::BufferAsset, cc::ArrayBuffer*, _nativeAsset, getNativeAssetForJS, setNativeAssetForJS);

%attribute(cc::TextureBase, bool, isCompressed, isCompressed);
%attribute(cc::TextureBase, uint32_t, _width, getWidth, setWidth);
%attribute(cc::TextureBase, uint32_t, width, getWidth, setWidth);
%attribute(cc::TextureBase, uint32_t, _height, getHeight, setHeight);
%attribute(cc::TextureBase, uint32_t, height, getHeight, setHeight);

%attribute(cc::SimpleTexture, uint32_t, mipmapLevel, mipmapLevel);
%attribute(cc::RenderTexture, cc::scene::RenderWindow*, window, getWindow);

%attribute(cc::Mesh, ccstd::hash_t, _hash, getHash);
%attribute(cc::Mesh, ccstd::hash_t, hash, getHash);
%attribute(cc::Mesh, cc::Uint8Array&, data, getData);
%attribute(cc::Mesh, cc::Uint8Array&, _data, getData);
%attribute(cc::Mesh, cc::Mesh::JointBufferIndicesType&, jointBufferIndices, getJointBufferIndices);
%attribute(cc::Mesh, cc::Vec3&, maxPosition, getMaxPosition);
%attribute(cc::Mesh, cc::Vec3&, minPosition, getMinPosition);
%attribute(cc::Mesh, cc::Mesh::RenderingSubMeshList&, renderingSubMeshes, getRenderingSubMeshes);
%attribute(cc::Mesh, uint32_t, subMeshCount, getSubMeshCount);
%attribute(cc::Mesh, cc::ArrayBuffer*, _nativeAsset, getAssetData, setAssetData);
%attribute(cc::Mesh, bool, _allowDataAccess, isAllowDataAccess, setAllowDataAccess);
%attribute(cc::Mesh, bool, allowDataAccess, isAllowDataAccess, setAllowDataAccess);

%attribute(cc::Material, cc::EffectAsset*, effectAsset, getEffectAsset, setEffectAsset);
%attribute(cc::Material, ccstd::string, effectName, getEffectName);
%attribute(cc::Material, uint32_t, technique, getTechniqueIndex);
%attribute(cc::Material, ccstd::hash_t, hash, getHash);
%attribute(cc::Material, cc::Material*, parent, getParent);

%attribute(cc::RenderingSubMesh, cc::Mesh*, mesh, getMesh, setMesh);
%attribute(cc::RenderingSubMesh, ccstd::optional<uint32_t>&, subMeshIdx, getSubMeshIdx, setSubMeshIdx);
%attribute(cc::RenderingSubMesh, ccstd::vector<cc::IFlatBuffer>&, flatBuffers, getFlatBuffers, setFlatBuffers);
%attribute(cc::RenderingSubMesh, ccstd::vector<cc::IFlatBuffer>&, _flatBuffers, getFlatBuffers, setFlatBuffers);
%attribute(cc::RenderingSubMesh, cc::gfx::BufferList&, jointMappedBuffers, getJointMappedBuffers);
%attribute(cc::RenderingSubMesh, cc::gfx::InputAssemblerInfo&, iaInfo, getIaInfo);
%attribute(cc::RenderingSubMesh, cc::gfx::InputAssemblerInfo&, _iaInfo, getIaInfo);
%attribute(cc::RenderingSubMesh, cc::gfx::PrimitiveMode, primitiveMode, getPrimitiveMode);

%attribute(cc::Skeleton, ccstd::vector<ccstd::string>&, joints, getJoints, setJoints);
%attribute(cc::Skeleton, ccstd::vector<ccstd::string>&, _joints, getJoints, setJoints);
%attribute(cc::Skeleton, ccstd::hash_t, hash, getHash, setHash);
%attribute(cc::Skeleton, ccstd::hash_t, _hash, getHash, setHash);
%attribute(cc::Skeleton, ccstd::vector<cc::Mat4>&, _invBindposes, getInverseBindposes);
%attribute(cc::Skeleton, ccstd::vector<cc::Mat4>&, invBindposes, getInverseBindposes);

%attribute(cc::EffectAsset, ccstd::vector<cc::ITechniqueInfo> &, techniques, getTechniques, setTechniques);
%attribute(cc::EffectAsset, ccstd::vector<cc::IShaderInfo> &, shaders, getShaders, setShaders);
%attribute(cc::EffectAsset, ccstd::vector<cc::IPreCompileInfo> &, combinations, getCombinations, setCombinations);

%attribute(cc::TextureCube, cc::TextureCubeMipmapAtlasInfo&, mipmapAtlas, getMipmapAtlas, setMipmapAtlas);
%attribute(cc::TextureCube, cc::ITextureCubeMipmap*, image, getImage, setImage);
%attribute(cc::TextureCube, ccstd::vector<cc::ITextureCubeMipmap> &, mipmaps, getMipmaps, setMipmaps);


%import "base/Macros.h"
%import "base/TypeDef.h"
%import "base/Ptr.h"
%import "base/memory/Memory.h"

%include "core/Types.h"

%import "core/ArrayBuffer.h"
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
%include "core/assets/TextureCube.h"
%include "core/assets/RenderTexture.h"
%include "core/assets/BufferAsset.h"
%include "core/assets/EffectAsset.h"
%include "core/assets/ImageAsset.h"
%include "core/assets/SceneAsset.h"
%include "core/assets/TextAsset.h"
%include "core/assets/Material.h"
%include "core/assets/RenderingSubMesh.h"
%include "core/builtin/BuiltinResMgr.h"
%include "3d/assets/Morph.h"
%include "3d/assets/MorphRendering.h"
%include "3d/assets/Mesh.h"
%include "3d/assets/Skeleton.h"
%include "3d/misc/CreateMesh.h"
