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

static long long gScriptSerializeTime = 0;

namespace cc {

struct ScriptSerializeMethods {
    se::Object *serialize{nullptr};
    se::Object *serializeInlineData{nullptr};
    se::Object *onAfterDeserialize{nullptr};
};

static ccstd::unordered_map<const char*, ScriptSerializeMethods> gScriptMethods;

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
    _depends.reserve(8020);
}


BinaryInputArchive::~BinaryInputArchive() {
    if (_scriptArchive != nullptr) {
        _scriptArchive->unroot();
        _scriptArchive->decRef();
        _scriptArchive = nullptr;
    }
    
    if (_scriptDeserializedMap != nullptr) {
        _scriptDeserializedMap->unroot();
        _scriptDeserializedMap->decRef();
        _scriptDeserializedMap = nullptr;
    }
    
    CC_SAFE_DELETE(_bufferView);
}

void BinaryInputArchive::setScriptArchive(se::Object* scriptArchive) {
    _scriptArchive = scriptArchive;
    _scriptArchive->root();
    _scriptArchive->incRef();
}

void BinaryInputArchive::setScriptDeserializedMap(se::Object* deserializedMap) {
    _scriptDeserializedMap = deserializedMap;
    _scriptDeserializedMap->root();
    _scriptDeserializedMap->incRef();
}

se::Value BinaryInputArchive::start(Uint8Array &&bufferView, ObjectFactory* factory) {
    clearRecordJSBInvoke();
    auto prevTime = std::chrono::steady_clock::now();

    assert(factory != nullptr);
    _objectFactory = factory;
    
    _bufferView = ccnew Uint8Array();
    *_bufferView = std::move(bufferView);
    _currentNode.reset(ccnew DeserializeNode("root", _bufferView->buffer()->getData() + _bufferView->byteOffset(), _bufferView->byteLength() - _bufferView->byteOffset()));
    
    _sharedMemoryActor.initialize(&_currentNode->_offset, sizeof(_currentNode->_offset));

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
    
    {
        auto nowTime = std::chrono::steady_clock::now();
        auto durationMS = (std::chrono::duration_cast<std::chrono::nanoseconds>(nowTime - prevTime).count()) / 1000000.0;
        
        CC_LOG_INFO("==> cjh BinaryInputArchive::init uuid stringlist cost: %lf ms", durationMS);
    }
    
    {
        se::Value args[2];
        se::HandleObject uuidListObj{se::Object::createArrayObject(_uuidList.size())};
        uint32_t i = 0;
        for (const auto& uuid : _uuidList) {
            uuidListObj->setArrayElement(i, se::Value(uuid.data()));
            ++i;
        }
        args[0].setObject(uuidListObj);
        
        i = 0;
        se::HandleObject stringListObj{se::Object::createArrayObject(_stringList.size())};
        for (const auto& str : _stringList) {
            stringListObj->setArrayElement(i, se::Value(str.data()));
            ++i;
        }
        args[1].setObject(stringListObj);
        
        se::ScriptEngine::getInstance()->callFunction(_scriptArchive, "_setUuidAndStringList", 2, args);
    }
    
    {
        auto nowTime = std::chrono::steady_clock::now();
        auto durationMS = (std::chrono::duration_cast<std::chrono::nanoseconds>(nowTime - prevTime).count()) / 1000000.0;
        
        CC_LOG_INFO("==> cjh BinaryInputArchive::create uuid stringlist scriptobj cost: %lf ms", durationMS);
    }

    setCurrentKey(nullptr);

    auto type = popString();

    se::Object* ret = _objectFactory->createScriptObject(type.data());
    assert(ret);

    ret->root(); // FIXME(cjh): How to unroot ?
    setCurrentOwner(ret);

    se::Value retVal;
    retVal.setObject(ret, true);

    se::Value onBeforeDeserializeVal;
    if (_scriptArchive->getProperty("_onBeforeDeserialize", &onBeforeDeserializeVal, true)) {
        onBeforeDeserializeVal.toObject()->call(se::EmptyValueArray, _scriptArchive);
    }
    
    ret->getPrivateObject()->serialize(*this);
    
    se::Value onAfterDeserialize;
    if (_scriptArchive->getProperty("_onAfterDeserialize", &onAfterDeserialize, true)) {
        onAfterDeserialize.toObject()->call(se::EmptyValueArray, _scriptArchive);
    }
    
    auto nowTime = std::chrono::steady_clock::now();
    auto durationMS = (std::chrono::duration_cast<std::chrono::nanoseconds>(nowTime - prevTime).count()) / 1000000.0;
    
    CC_LOG_INFO("==> cjh BinaryInputArchive::start cost: %lf ms", durationMS);
    CC_LOG_INFO("==> cjh gScriptSerializeTime: %lf ms", gScriptSerializeTime / 1000000.0);
    CC_LOG_INFO("==> cjh mapping size: %u", (uint32_t)se::NativePtrToObjectMap::size());
    
    printJSBInvoke();
    clearRecordJSBInvoke();
    
    // Reset
    _deserializedObjIdMap.clear();
    _uuidList.clear();
    _uuidList.shrink_to_fit();
    _stringList.clear();
    _stringList.shrink_to_fit();
    _currentNode.reset();
    
    assert(_propertyStack.empty());
    
    return retVal;
}

se::Value& BinaryInputArchive::anyValue(se::Value& value, const char* name) {
    auto tag = _currentNode->popInt8();

    switch (tag) {
        case TAG_NULL:
            value.setNull();
            break;
        case TAG_UNDEFINED:
            value.setUndefined();
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

    setCurrentOwner(seObj);

    int32_t elementCount = _currentNode->popInt32();
    for (int32_t i = 0; i < elementCount; ++i) {
        AutoSaveRestorePropertyInfo asr(this);

        setCurrentKey(popString().data());

        se::Value seValue;
        seValue = anyValue(seValue, getCurrentKey());
        seObj->setProperty(getCurrentKey(), seValue);
    }

    value.setObject(seObj);

    if (needRelease) {
        seObj->unroot();
        seObj->decRef();
    }
}

se::Value& BinaryInputArchive::plainObj(se::Value& value, const char* name) {
    AutoSaveRestorePropertyInfo asr(this);

    setCurrentKey(name);

    doSerializePlainObj(value);
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
    bool fromCache = false;
    void* obj = getOrCreateNativeObjectReturnVoidPtr(scriptObject, resetOffset, fromCache);
    if (scriptObject != nullptr) {
        setCurrentOwner(scriptObject);
        if (obj != nullptr) {
            assert(false);
//cjh            if (_deserializedObjects.find(obj) == _deserializedObjects.cend()) {
//                scriptObject->getPrivateObject()->serialize(*this);
//            } else {
//                CC_LOG_DEBUG("serializableObj return from cache, scriptObject: %p", scriptObject);
//            }
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
    AutoSaveRestorePropertyInfo asr(this);

    setCurrentKey(name);

    doSerializeSerializableObj(value);
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

    setCurrentOwner(seObj);

    for (uint32_t i = 0; i < length; ++i) {
        AutoSaveRestorePropertyInfo asr(this);
        setCurrentKey(i);

        se::Value seValue;
        doSerializeAny(seValue);
        seObj->setArrayElement(i, seValue);
    }

    value.setObject(seObj);

    if (needRelease) {
        seObj->unroot();
        seObj->decRef();
    }
}

se::Value& BinaryInputArchive::serializableObjArray(se::Value& value, const char* name) {
    AutoSaveRestorePropertyInfo asr(this);

    setCurrentKey(name);
    int32_t length = 0;

    const auto tag = _currentNode->popInt8();
    switch (tag) {
        case TAG_NULL:
            value.setNull();
            return value;
        case TAG_UNDEFINED:
            value.setUndefined();
            return value;
        case TAG_ARRAY:
            length = _currentNode->popInt32();
            break;
        default:
            assert(false);
            value.setNull();
            return value;
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

    setCurrentOwner(seObj);

    for (uint32_t i = 0; i < static_cast<uint32_t>(length); ++i) {
        AutoSaveRestorePropertyInfo asr2(this);
        
        setCurrentKey(i);
        se::Value seValue;
        doSerializeSerializableObj(seValue);
        seObj->setArrayElement(i, seValue);
    }

    value.setObject(seObj);
    if (needRelease) {
        seObj->unroot();
        seObj->decRef();
    }
    return value;
}

se::Value& BinaryInputArchive::arrayObj(se::Value& value, const char* name) {
    AutoSaveRestorePropertyInfo asr(this);

    setCurrentKey(name);

    doSerializeArray(value);
    return value;
}

void BinaryInputArchive::doSerializeAny(se::Value& value) {
    const auto tag = _currentNode->popInt8();

    switch (tag) {
        case TAG_NULL:
            value.setNull();
            break;
        case TAG_UNDEFINED:
            value.setUndefined();
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
    auto prevTime = std::chrono::steady_clock::now();
    if (obj == nullptr) {
        return;
    }
    
    assert(obj->_getClass() != nullptr);
    
    const char *clsName = obj->_getClass()->getName();
    assert(clsName != nullptr);
    se::Value serializeVal;
    se::Value serializeInlineDataVal;
    
    auto iter = gScriptMethods.find(clsName);
    if (iter == gScriptMethods.end()) {
        ScriptSerializeMethods methods;
        if (obj->_getClass()->getProto()->getProperty("serialize", &serializeVal, true)
            && serializeVal.isObject() && serializeVal.toObject()->isFunction()) {
            methods.serialize = serializeVal.toObject();
            methods.serialize->root();
            methods.serialize->incRef();//TODO: release
        }
        
        if (obj->_getClass()->getProto()->getProperty("serializeInlineData", &serializeInlineDataVal, true)
            && serializeInlineDataVal.isObject() && serializeInlineDataVal.toObject()->isFunction()) {
            methods.serializeInlineData = serializeInlineDataVal.toObject();
            methods.serializeInlineData->root();
            methods.serializeInlineData->incRef();//TODO: release
        }
        
        gScriptMethods.emplace(clsName, std::move(methods));
    } else {
        if (iter->second.serialize) {
            serializeVal.setObject(iter->second.serialize);
        }
        
        if (iter->second.serializeInlineData) {
            serializeInlineDataVal.setObject(iter->second.serializeInlineData);
        }
    }

    bool hasSerializeMethod = serializeVal.isObject();
    bool hasSerializeInlineDataMethod = serializeInlineDataVal.isObject();
    if (!hasSerializeMethod && !hasSerializeInlineDataMethod) {
        return;
    }

    static se::ValueArray args;
    args.resize(1);
    args[0].setObject(_scriptArchive);

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
       
    auto nowTime = std::chrono::steady_clock::now();
    auto durationNS = std::chrono::duration_cast<std::chrono::nanoseconds>(nowTime - prevTime).count();
    gScriptSerializeTime += durationNS;
}

void* BinaryInputArchive::getOrCreateNativeObjectReturnVoidPtr(se::Object*& outScriptObject, ccstd::optional<uint32_t>& resetOffset, bool& fromCache) {
    fromCache = false;
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
            fromCache = true;
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
        if (outScriptObject != nullptr) {
            _scriptDeserializedMap->setMapElement(se::Value(targetOffset), se::Value(outScriptObject));
        }
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
    auto *cls = obj->_getClass();
    assert(cls != nullptr);
    auto iter = gScriptMethods.find(cls->getName());
    assert(iter != gScriptMethods.end());
    
    if (iter->second.onAfterDeserialize == nullptr) {
        if (cls->getProto()->getProperty("onAfterDeserialize", &onAfterDeserializeVal, true)
            && onAfterDeserializeVal.isObject() && onAfterDeserializeVal.toObject()->isFunction()) {
            onAfterDeserializeVal.toObject()->root();
            onAfterDeserializeVal.toObject()->incRef();
            iter->second.onAfterDeserialize = onAfterDeserializeVal.toObject();
        }
    } else {
        onAfterDeserializeVal.setObject(iter->second.onAfterDeserialize);
    }

    bool hasOnAfterDeserializeMethod = onAfterDeserializeVal.isObject();
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
            assert(getCurrentKey() != nullptr || getCurrentKeyInteger() != -1);
            assert(!(getCurrentKey() == nullptr && getCurrentKeyInteger() == -1));

            AssetDependInfo dependInfo;
            dependInfo.uuidIndex = uuidIndex;
            dependInfo.owner = getCurrentOwner();
            if (getCurrentKeyInteger() > -1) {
                dependInfo.setPropName(getCurrentKeyInteger());
            } else {
                dependInfo.setPropName(getCurrentKey());
            }

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
