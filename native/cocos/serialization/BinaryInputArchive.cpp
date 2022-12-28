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

DeserializeNode::DeserializeNode(const ccstd::string &name, uint8_t *buffer, uint32_t bufferByteLength) {
    _name = name;
    _data.initWithBuffer(buffer, bufferByteLength);
}

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
}


BinaryInputArchive::~BinaryInputArchive() {

}

se::Value BinaryInputArchive::start(ArrayBuffer::Ptr arrayBuffer, ObjectFactory* factory) {
    assert(factory != nullptr);
    _objectFactory = factory;
    
    _buffer = arrayBuffer;
    _currentNode.reset(ccnew DeserializeNode("root", _buffer->getData(), _buffer->byteLength()));

    _uuidList.reserve(5);
    _stringList.reserve(32);

    uint32_t uuidCount = _currentNode->popUint32();
    for (uint32_t i = 0; i < uuidCount; ++i) {
        auto uuid = _currentNode->popString();
        _uuidList.emplace_back(std::move(uuid));
    }

    uint32_t stringCount = _currentNode->popUint32();
    for (uint32_t i = 0; i < stringCount; ++i) {
        auto str = _currentNode->popString();
        _stringList.emplace_back(std::move(str));
    }

    _currentKey = nullptr;

    auto type = popString();

    se::Object* ret = _objectFactory->createScriptObject(type.data());
    assert(ret);

    ret->root(); // FIXME(cjh): How to unroot ?
    _currentOwner = ret;

    se::Value retVal;
    retVal.setObject(ret, true);

    ret->getPrivateObject()->serialize(*this);
    return retVal;
}

se::Value& BinaryInputArchive::anyValue(se::Value& value, const char* name) {
    auto tag = _currentNode->popInt8();

    switch (tag) {
        case TAG_NONE:
            value.setNull();
            break;
        case TAG_BOOLEAN:
            value.setBoolean(_currentNode->popBoolean());
            break;
        case TAG_MAP:
            value = plainObj(value, name);
            break;
        case TAG_SERIALIZABLE_OBJECT:
            value = serializableObj(value, name);
            break;
        case TAG_ARRAY:
            arrayObj(value, name);
            break;
        case TAG_STRING:
            value.setString(popString());
            break;
        case TAG_NUMBER:
            value.setDouble(_currentNode->popFloat64());
            break;
        default:
            break;
    }

    return value;
}

void BinaryInputArchive::doSerializePlainObj(se::Value& value) {
    se::Object* seObj = nullptr;
    bool needRelease = false;
    if (value.isObject()) {
        seObj = value.toObject();
        seObj->root();
        seObj->incRef();
    } else {
        seObj = se::Object::createPlainObject();
        seObj->root();
        needRelease = true;
    }

    _currentOwner = seObj;

    int32_t elementCount = _currentNode->popInt32();
    for (int32_t i = 0; i < elementCount; ++i) {
        se::Object* oldOwner = _currentOwner;

        _currentKey = popString().data();

        se::Value seValue;
        seValue = anyValue(seValue, _currentKey);
        seObj->setProperty(_currentKey, seValue);

        _currentOwner = oldOwner;
    }

    value.setObject(seObj);

    if (needRelease) {
        seObj->unroot();
        seObj->decRef();
    }
}

se::Value& BinaryInputArchive::plainObj(se::Value& value, const char* name) {
    const char* oldKey = _currentKey;
    auto* oldOwner = _currentOwner;

    _currentKey = name;

    doSerializePlainObj(value);

    _currentKey = oldKey;
    _currentOwner = oldOwner;
    return value;
}

void BinaryInputArchive::doSerializeSerializableObj(se::Value& value) {
    auto oldObjectFlags = _currentObjectFlags;
    _currentObjectFlags = _currentNode->popUint8();

    if (_currentObjectFlags & OBJECT_KIND_FLAG_NULL) {
        _currentObjectFlags = oldObjectFlags;
        value.setNull();
        return;
    }

    auto* dependInfo = checkAssetDependInfo();
    if (dependInfo != nullptr) {
        _currentObjectFlags = oldObjectFlags;
        value.setNull();
        return;
    }

    se::Object* scriptObject{nullptr};
    if (value.isObject()) {
        scriptObject = value.toObject();
    }
    ccstd::optional<uint32_t> resetOffset;
    void* obj = getOrCreateNativeObjectReturnVoidPtr(scriptObject, resetOffset);
    if (scriptObject != nullptr) {
        _currentOwner = scriptObject;
        if (obj != nullptr) {
            if (std::find(_deserializedObjects.cbegin(), _deserializedObjects.cend(), obj) == _deserializedObjects.cend()) {
                scriptObject->getPrivateObject()->serialize(*this);
            } else {
//                CC_LOG_DEBUG("serializableObj return from cache, scriptObject: %p", scriptObject);
            }
        } else {
            serializeScriptObject(scriptObject);
        }
        value.setObject(scriptObject);
    }

    if (resetOffset.has_value()) {
        _currentNode->setOffset(resetOffset.value());
    }
    _currentObjectFlags = oldObjectFlags; // TODO(cjh): Use cpp stack for safety reset flags
}

se::Value& BinaryInputArchive::serializableObj(se::Value& value, const char* name) {
    const char* oldKey = _currentKey;
    auto* oldOwner = _currentOwner;

    _currentKey = name;

    doSerializeSerializableObj(value);

    _currentKey = oldKey;
    _currentOwner = oldOwner;
    return value;
}

void BinaryInputArchive::doSerializeArray(se::Value& value) {
    uint32_t length = static_cast<uint32_t>(_currentNode->popInt32());
    se::Object* seObj = nullptr;
    bool needRelease = false;
    if (value.isObject() && value.toObject()->isArray()) {
        seObj = value.toObject();
        seObj->root();
        seObj->incRef();
    } else {
        seObj = se::Object::createArrayObject(length);
        seObj->root(); // FIXME(cjh): How to unroot?
        needRelease = true;
    }

    _currentOwner = seObj;
    char keyTmp[12] = {0};

    for (uint32_t i = 0; i < length; ++i) {
        se::Object* oldOwner = _currentOwner;

        snprintf(keyTmp, sizeof(keyTmp), "%u", i);
        _currentKey = keyTmp;

        se::Value seValue;
        doSerializeAny(seValue);
        seObj->setArrayElement(i, seValue);

        _currentOwner = oldOwner;
    }

    value.setObject(seObj);

    if (needRelease) {
        seObj->unroot();
        seObj->decRef();
    }
}

se::Value& BinaryInputArchive::serializableObjArray(se::Value& value, const char* name) {
    if (0 == strcmp("_materials", name)) {
        int a = 0;
    }
    const char* oldKey = _currentKey;
    auto* oldOwner = _currentOwner;

    _currentKey = name;
    int32_t length = 0;

    const auto tag = _currentNode->popInt8();
    switch (tag) {
        case TAG_NONE:
            value.setNull();
            return value;
        case TAG_ARRAY:
            length = _currentNode->popInt32();
            break;
        default:
            assert(false);
            value.setNull();
            return value;
            break;
    }

    se::Object* seObj = nullptr;
    bool needRelease = false;
    if (value.isObject() && value.toObject()->isArray()) {
        seObj = value.toObject();
        seObj->root(); //TODO(cjh): how to unroot and decRef it?
        seObj->incRef();
    } else {
        seObj = se::Object::createArrayObject(static_cast<uint32_t>(length));
        seObj->root();
        needRelease = true;
    }

    char keyTmp[12] = {0};
    _currentOwner = seObj;

    for (uint32_t i = 0; i < static_cast<uint32_t>(length); ++i) {
        se::Object* oldOwner = _currentOwner;

        snprintf(keyTmp, sizeof(keyTmp), "%u", i);
        _currentKey = keyTmp;

        se::Value seValue;
        doSerializeSerializableObj(seValue);
        seObj->setArrayElement(i, seValue);

        _currentOwner = oldOwner;
    }

    value.setObject(seObj);
    if (needRelease) {
        seObj->unroot();
        seObj->decRef();
    }

    _currentKey = oldKey;
    _currentOwner = oldOwner;
    return value;
}

se::Value& BinaryInputArchive::arrayObj(se::Value& value, const char* name) {
    const char* oldKey = _currentKey;
    auto* oldOwner = _currentOwner;

    _currentKey = name;

    doSerializeArray(value);

    _currentKey = oldKey;
    _currentOwner = oldOwner;
    return value;
}

void BinaryInputArchive::doSerializeAny(se::Value& value) {
    const auto tag = _currentNode->popInt8();

    switch (tag) {
        case TAG_NONE:
            value.setNull();
            break;
        case TAG_BOOLEAN:
            value.setBoolean(_currentNode->popBoolean());
            break;
        case TAG_MAP:
            doSerializePlainObj(value);
            break;
        case TAG_SERIALIZABLE_OBJECT:
            doSerializeSerializableObj(value);
            break;
        case TAG_ARRAY:
            doSerializeArray(value);
            break;
        case TAG_STRING:
            value.setString(popString());
            break;
        case TAG_NUMBER:
            value.setDouble(_currentNode->popFloat64());
            break;
        default:
            break;
    }
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

void* BinaryInputArchive::getOrCreateNativeObjectReturnVoidPtr(se::Object*& outScriptObject, ccstd::optional<uint32_t>& resetOffset) {
    if (_currentObjectFlags & OBJECT_KIND_FLAG_NULL) {
        outScriptObject = nullptr;
        return nullptr;
    }

    bool isInline = _currentObjectFlags & OBJECT_KIND_FLAG_INLINE;
    uint32_t currentOffset = _currentNode->getOffset();
    int32_t targetOffset = 0;

    if (!isInline) {
        targetOffset = _currentNode->popInt32();
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

        _currentNode->setOffset(targetOffset);
        resetOffset = currentOffset + 4;
    }

    const char* type = popString().data();

    void* obj = nullptr;
    if (outScriptObject == nullptr) {
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
    } else {
        obj = outScriptObject->getPrivateData();
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
    if ((_currentObjectFlags & OBJECT_KIND_FLAG_NULL)) {
        return nullptr;
    }

    if (_currentObjectFlags & OBJECT_KIND_FLAG_INLINE) {
        int32_t uuidAdvance = _currentNode->popInt32();
        if (uuidAdvance != -1) {
            _currentNode->setOffset(_currentNode->getOffset() + uuidAdvance);
            auto uuidIndex = _currentNode->popUint32();
            assert(uuidIndex >= 0 && uuidIndex < _uuidList.size());

            AssetDependInfo dependInfo;
            dependInfo.uuid = _uuidList[uuidIndex];
            dependInfo.owner = _currentOwner;
            dependInfo.propName = _currentKey;
            
            assert(dependInfo.uuid.length() >= 36 && dependInfo.uuid[0] != '\0');

//            CC_LOG_DEBUG("Found __uuid__: %s, owner: %p, current key: %s", dependInfo.uuid.data(), _currentOwner, _currentKey);

            _depends.emplace_back(std::move(dependInfo));
            return &_depends.back();
        }
    }

    return nullptr;
}

/* static */
void* BinaryInputArchive::seObjGetPrivateData(se::Object* obj) {
    return obj->getPrivateData();
}

std::string_view BinaryInputArchive::popString() {
    auto index = _currentNode->popUint32();
    assert(index >= 0 && index < _stringList.size());
    return _stringList[index];
}

}
