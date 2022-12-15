/****************************************************************************
 Copyright (c) 2022 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

#include "BinaryInputArchive.h"
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"

namespace cc {

std::pair<uint32_t, uint32_t> DeserializeNode::popDependTargetInfo() {
    int32_t offset = popInt32();
    int32_t size = popInt32();
    return {offset, size};
}

int32_t DeserializeNode::popArrayTagAndReturnLength() {
    int8_t tag = popInt8();
    assert(tag == SerializeTag::TAG_ARRAY);
    return popInt32();
}

void DeserializeNode::popMapTag() {
    int8_t tag = popInt8();
    assert(tag == SerializeTag::TAG_MAP);
}

// BinaryInputArchive

BinaryInputArchive::BinaryInputArchive() {
    _currentObjectFlags.flags.isInline = false;
    _currentObjectFlags.flags.isUUIDRef = false;
    _currentObjectFlags.flags.padding = 0;
}


BinaryInputArchive::~BinaryInputArchive() {

}

se::Value BinaryInputArchive::start(ArrayBuffer::Ptr arrayBuffer, ObjectFactory* factory) {
    return {};
}

void BinaryInputArchive::serializeScriptObject(se::Object* obj) {
    if (obj == nullptr) {
        return;
    }

    se::Value serializeVal;
    obj->getProperty("serialize", &serializeVal);

    se::Value serializeInlineDataVal;
    obj->getProperty("serializeInlineData", &serializeInlineDataVal);

    bool hasSerializeMethod = serializeVal.isObject() && serializeVal.toObject()->isFunction();
    bool hasSerializeInlineDataMethod = serializeInlineDataVal.isObject() && serializeInlineDataVal.toObject()->isFunction();
    if (!hasSerializeMethod && !hasSerializeInlineDataMethod) {
        return;
    }

    static se::ValueArray args;
    args.resize(1);
    bool ok = nativevalue_to_se(this, args[0]);
    assert(ok);

    if (hasSerializeMethod && hasSerializeInlineDataMethod) {
        if (_isRoot) {
            _isRoot = false;
            serializeVal.toObject()->call(args, obj);
        } else {
            serializeInlineDataVal.toObject()->call(args, obj);
        }
    } else {
        _isRoot = false;
        if (hasSerializeMethod) {
            serializeVal.toObject()->call(args, obj);
        } else if (hasSerializeInlineDataMethod) {
            serializeInlineDataVal.toObject()->call(args, obj);
        }
    }
}

void* BinaryInputArchive::getOrCreateNativeObjectReturnVoidPtr(se::Object*& outScriptObject) {
    bool isInline = _currentNode->popBoolean();
    uint32_t currentOffset = _currentNode->getOffset();
    uint32_t targetOffset = 0;

    if (!isInline) {
        targetOffset = _currentNode->popInt32();
        if (targetOffset == -1) {
            // console.log(`return null, currentOffset: ${currentOffset-1}`);
            _currentNode->popInt32(); // pop size
            return nullptr;
        }

        if (targetOffset < 0 || targetOffset >= _currentNode->getDataByteLength()) {
            return nullptr;
        }

        auto cachedMapIter = _deserializedObjIdMap.find(targetOffset);
        if (cachedMapIter != _deserializedObjIdMap.end()) {
            const auto& info = cachedMapIter->second;
            assert(info.offset == targetOffset);
            outScriptObject = info.scriptObj;
            return info.nativeObj;
        }
    }

    if (!isInline) {
        _currentNode->setOffset(targetOffset);
    } else {
        _currentNode->setOffset(currentOffset);
    }

    const char* type = _currentNode->popString().data();

    void* obj = nullptr;
    if (_objectFactory->needCreateScriptObject(type)) {
        se::Object* seObj = _objectFactory->createScriptObject(type);
        if (seObj != nullptr) {
            seObj->root(); // FIXME(cjh): When to unroot it?
            obj = seObj->getPrivateData();
        }
        outScriptObject = seObj;
    } else {
        obj = _objectFactory->createNativeObject(type);
        outScriptObject = nullptr;
    }

    if (targetOffset > 0) {
        assert(_deserializedObjIdMap.find(targetOffset) == _deserializedObjIdMap.end());
        DeserializedInfo info;
        info.offset = targetOffset;
        info.nativeObj = obj;
        info.scriptObj = outScriptObject;
        _deserializedObjIdMap[targetOffset] = info;
    }
    return obj;
}

void BinaryInputArchive::serializeScriptObjectByNativePtr(const void* nativeObj) {
    auto iter = se::NativePtrToObjectMap::find(const_cast<void*>(nativeObj));
    if (iter != se::NativePtrToObjectMap::end()) {
        serializeScriptObject(iter->second);
    }
}

void BinaryInputArchive::onAfterDeserializeScriptObject(se::Object* obj) {
    if (obj == nullptr) {
        return;
    }

    se::Value onAfterDeserializeVal;
    obj->getProperty("onAfterDeserialize", &onAfterDeserializeVal);

    bool hasOnAfterDeserializeMethod = onAfterDeserializeVal.isObject() && onAfterDeserializeVal.toObject()->isFunction();
    if (!hasOnAfterDeserializeMethod) {
        return;
    }

    static se::ValueArray args;
    args.resize(1);
    bool ok = nativevalue_to_se(this, args[0]);
    assert(ok);

    if (hasOnAfterDeserializeMethod) {
        onAfterDeserializeVal.toObject()->call(args, obj);
    }
}

void BinaryInputArchive::onAfterDeserializeScriptObjectByNativePtr(const void* nativeObj) {
    auto iter = se::NativePtrToObjectMap::find(const_cast<void*>(nativeObj));
    if (iter != se::NativePtrToObjectMap::end()) {
        onAfterDeserializeScriptObject(iter->second);
    }
}

AssetDependInfo* BinaryInputArchive::checkAssetDependInfo() {
    if (!_currentObjectFlags.flags.isUUIDRef) {
        return nullptr;
    }

    auto uuid = _currentNode->popString();
    assert(!uuid.empty());

    AssetDependInfo dependInfo;
    dependInfo.uuid = uuid.data();
    dependInfo.owner = _currentOwner;
    dependInfo.propName = _currentKey;

    CC_LOG_DEBUG("Found __uuid__, owner: %p, current key: %s", _currentOwner, _currentKey);

    _depends.emplace_back(std::move(dependInfo));
    return &_depends.back();
}

/* static */
void* BinaryInputArchive::seObjGetPrivateData(se::Object* obj) {
    return obj->getPrivateData();
}

}
