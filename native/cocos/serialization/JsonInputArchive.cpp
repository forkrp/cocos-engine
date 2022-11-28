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

#include "JsonInputArchive.h"
#include "bindings/jswrapper/SeApi.h"
#include "bindings/manual/jsb_conversions.h"

namespace cc {

JsonInputArchive::JsonInputArchive() {
    _deserializedObjects.reserve(10);
}

JsonInputArchive::~JsonInputArchive() {
}

se::Value JsonInputArchive::start(const std::string& rootJsonStr, ObjectFactory* factory) {
    assert(factory != nullptr);
    _objectFactory = factory;

    rapidjson::Document d;
    d.Parse(rootJsonStr.c_str());
    if (d.HasParseError()) {
        return se::Value::Null;
    }

    if (d.IsArray()) {
        _serializedData = std::move(d);
    } else {
        rapidjson::Document arrDoc;
        arrDoc.SetArray();
        arrDoc.PushBack(d, arrDoc.GetAllocator());
        _serializedData = std::move(arrDoc);
    }

    _currentNode = &_serializedData[0];
    _currentKey = nullptr;

    const char* type = findTypeInJsonObject(*_currentNode);

    se::Object* ret = _objectFactory->createScriptObject(type);
    assert(ret);

    ret->root(); // FIXME(cjh): How to unroot ?
    _currentOwner = ret;

    se::Value retVal;
    retVal.setObject(ret, true);

    ret->getPrivateObject()->serialize(*this);
    return retVal;
}

const rapidjson::Value* JsonInputArchive::getValue(const rapidjson::Value* parentNode, const char* key) {
    if (parentNode == nullptr) {
        return nullptr;
    }

    const rapidjson::Value* ret = nullptr;
    if (parentNode->IsObject()) {
        rapidjson::Value::ConstMemberIterator iter = parentNode->FindMember(key);
        if (iter != parentNode->MemberEnd()) {
            ret = &iter->value;
        }
    }

    return ret;
}

/* static */
const char* JsonInputArchive::findTypeInJsonObject(const rapidjson::Value& jsonObj) {
    rapidjson::Value::ConstMemberIterator iter = jsonObj.FindMember("__type__");
    bool found = iter != jsonObj.MemberEnd();
    if (!found) {
        return nullptr;
    }

    if (!iter->value.IsString()) {
        return nullptr;
    }
    return iter->value.GetString();
}

void* JsonInputArchive::getOrCreateNativeObjectReturnVoidPtr(se::Object*& outScriptObject) {
    if (!_currentNode->IsObject()) {
        return nullptr;
    }

    int32_t index = -1;
    bool couldDeserialize = false;
    const char* type = findTypeInJsonObject(*_currentNode);

    if (nullptr == type) {
        const auto& iter = _currentNode->FindMember("__id__");
        couldDeserialize = iter != _currentNode->MemberEnd();
        if (couldDeserialize && !iter->value.IsInt()) {
            return nullptr;
        }

        index = iter->value.GetInt();
        if (index < 0 || index >= _serializedData.Size()) {
            return nullptr;
        }

        auto cachedMapIter = _deserializedObjIdMap.find(index);
        if (cachedMapIter != _deserializedObjIdMap.end()) {
            const auto& info = cachedMapIter->second;
            assert(info.index == index);
            outScriptObject = info.scriptObj;
            return info.nativeObj;
        }

        _currentNode = &_serializedData[index];
        type = findTypeInJsonObject(*_currentNode);

        if (nullptr == type) {
            return nullptr;
        }
    }

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

    if (index >= 0) {
        assert(_deserializedObjIdMap.find(index) == _deserializedObjIdMap.end());
        DeserializedInfo info;
        info.index = index;
        info.nativeObj = obj;
        info.scriptObj = outScriptObject;
        _deserializedObjIdMap[index] = info;
    }
    return obj;
}

se::Value& JsonInputArchive::anyValue(se::Value& value, const char* name) {
    auto iter = _currentNode->FindMember(name);
    if (iter == _currentNode->MemberEnd()) {
        value.setUndefined();
        return value;
    }
    const auto& data = iter->value;

    switch (data.GetType()) {
        case rapidjson::kNullType:
            value.setNull();
            break;
        case rapidjson::kFalseType:
            value.setBoolean(false);
            break;
        case rapidjson::kTrueType:
            value.setBoolean(true);
            break;
        case rapidjson::kObjectType:
            if (data.HasMember("__id__")) {
                value = serializableObj(value, name);
            } else {
                value = plainObj(value, name);
            }
            break;
        case rapidjson::kArrayType:
            arrayObj(value, name);
            break;
        case rapidjson::kStringType:
            value.setString(iter->value.GetString());
            break;
        case rapidjson::kNumberType:
            value.setDouble(iter->value.GetDouble());
            break;
        default:
            break;
    }

    return value;
}

se::Value& JsonInputArchive::plainObj(se::Value& value, const char* name) {
    auto* parentNode = _currentNode;
    const char* oldKey = _currentKey;
    auto* oldOwner = _currentOwner;

    _currentNode = getValue(parentNode, name);
    _currentKey = name;

    if (_currentNode != nullptr) {
        if (_currentNode->IsObject()) {
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

            const auto& curJSONObj = _currentNode->GetObject();
            for (const auto& e : curJSONObj) {
                se::Object* oldOwner = _currentOwner;
                assert(e.name.IsString());
                _currentNode = &e.value;
                _currentKey = e.name.GetString();

                se::Value seValue;
                seValue = anyValue(seValue, e.name.GetString());
                seObj->setProperty(e.name.GetString(), seValue);

                _currentOwner = oldOwner;
            }

            value.setObject(seObj);

            if (needRelease) {
                seObj->unroot();
                seObj->decRef();
            }
        } else {
            assert(false);
        }
    }

    _currentNode = parentNode;
    _currentKey = oldKey;
    _currentOwner = oldOwner;
    return value;
}

void JsonInputArchive::doSerializeObj(se::Value& value) {
    if (_currentNode != nullptr) {
        auto* dependInfo = checkAssetDependInfo();
        if (dependInfo != nullptr) {
            return;
        }

        se::Object* scriptObject{nullptr};
        void* obj = getOrCreateNativeObjectReturnVoidPtr(scriptObject);
        if (scriptObject != nullptr) {
            _currentOwner = scriptObject;
            if (obj != nullptr) {
                if (std::find(_deserializedObjects.cbegin(), _deserializedObjects.cend(), obj) == _deserializedObjects.cend()) {
                    scriptObject->getPrivateObject()->serialize(*this);
                } else {
                    CC_LOG_DEBUG("serializableObj return from cache, scriptObject: %p", scriptObject);
                }
            } else {
                serializeScriptObject(scriptObject);
            }
            value.setObject(scriptObject);
        }
    }
}

se::Value& JsonInputArchive::serializableObj(se::Value& value, const char* name) {
    auto* parentNode = _currentNode;
    const char* oldKey = _currentKey;
    auto* oldOwner = _currentOwner;

    _currentNode = getValue(parentNode, name);
    _currentKey = name;

    doSerializeObj(value);

    _currentNode = parentNode;
    _currentKey = oldKey;
    _currentOwner = oldOwner;
    return value;
}

void JsonInputArchive::doSerializeArray(se::Value& value) {
    if (_currentNode != nullptr) {
        if (_currentNode->IsArray()) {
            se::Object* seObj = nullptr;
            bool needRelease = false;
            if (value.isObject() && value.toObject()->isArray()) {
                seObj = value.toObject();
                seObj->root();
                seObj->incRef();
            } else {
                seObj = se::Object::createArrayObject(_currentNode->GetArray().Size());
                seObj->root(); //FIXME(cjh): How to unroot?
                needRelease = true;
            }

            _currentOwner = seObj;
            char keyTmp[12] = {0};

            uint32_t i = 0;
            for (const auto& e : _currentNode->GetArray()) {
                se::Object* oldOwner = _currentOwner;

                _currentNode = &e;
                snprintf(keyTmp, sizeof(keyTmp), "%u", i);
                _currentKey = keyTmp;

                se::Value seValue;
                doSerializeAny(seValue);
                seObj->setArrayElement(i, seValue);

                _currentOwner = oldOwner;
                ++i;
            }

            value.setObject(seObj);

            if (needRelease) {
                seObj->unroot();
                seObj->decRef();
            }
        } else {
            assert(false);
        }
    }
}

se::Value& JsonInputArchive::serializableObjArray(se::Value& value, const char* name) {
    auto* parentNode = _currentNode;
    const char* oldKey = _currentKey;
    auto* oldOwner = _currentOwner;

    _currentNode = getValue(parentNode, name);
    _currentKey = name;

    if (_currentNode != nullptr) {
        if (_currentNode->IsArray()) {
            se::Object* seObj = nullptr;
            bool needRelease = false;
            if (value.isObject() && value.toObject()->isArray()) {
                seObj = value.toObject();
                seObj->root();
                seObj->incRef();
            } else {
                seObj = se::Object::createArrayObject(_currentNode->GetArray().Size());
                seObj->root();
                needRelease = true;
            }

            char keyTmp[12] = {0};
            _currentOwner = seObj;

            uint32_t i = 0;
            for (const auto& e : _currentNode->GetArray()) {
                se::Object* oldOwner = _currentOwner;

                _currentNode = &e;
                snprintf(keyTmp, sizeof(keyTmp), "%u", i);
                _currentKey = keyTmp;

                se::Value seValue;
                doSerializeObj(seValue);
                seObj->setArrayElement(i, seValue);

                _currentOwner = oldOwner;
                ++i;
            }

            value.setObject(seObj);
            if (needRelease) {
                seObj->unroot();
                seObj->decRef();
            }
        } else {
            assert(false);
        }
    }

    _currentNode = parentNode;
    _currentKey = oldKey;
    _currentOwner = oldOwner;
    return value;
}

se::Value& JsonInputArchive::arrayObj(se::Value& value, const char* name) {
    auto* parentNode = _currentNode;
    const char* oldKey = _currentKey;
    auto* oldOwner = _currentOwner;

    _currentNode = getValue(parentNode, name);
    _currentKey = name;

    doSerializeArray(value);

    _currentNode = parentNode;
    _currentKey = oldKey;
    _currentOwner = oldOwner;
    return value;
}

void JsonInputArchive::doSerializeAny(se::Value& value) {
    const auto& data = *_currentNode;

    switch (data.GetType()) {
        case rapidjson::kNullType:
            value.setNull();
            break;
        case rapidjson::kFalseType:
            value.setBoolean(false);
            break;
        case rapidjson::kTrueType:
            value.setBoolean(true);
            break;
        case rapidjson::kObjectType:
            doSerializeObj(value);
            break;
        case rapidjson::kArrayType:
            doSerializeArray(value);
            break;
        case rapidjson::kStringType:
            value.setString(data.GetString());
            break;
        case rapidjson::kNumberType:
            value.setDouble(data.GetDouble());
            break;
        default:
            break;
    }
}

void JsonInputArchive::serializeScriptObject(se::Object* obj) {
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

void JsonInputArchive::serializeScriptObjectByNativePtr(void* nativeObj) {
    auto iter = se::NativePtrToObjectMap::find(nativeObj);
    if (iter != se::NativePtrToObjectMap::end()) {
        serializeScriptObject(iter->second);
    }
}

void JsonInputArchive::onAfterDeserializeScriptObject(se::Object* obj) {
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

void JsonInputArchive::onAfterDeserializeScriptObjectByNativePtr(void* nativeObj) {
    auto iter = se::NativePtrToObjectMap::find(nativeObj);
    if (iter != se::NativePtrToObjectMap::end()) {
        onAfterDeserializeScriptObject(iter->second);
    }
}

AssetDependInfo* JsonInputArchive::checkAssetDependInfo() {
    if (!_currentNode->IsObject()) {
        return nullptr;
    }
    
    auto iter = _currentNode->FindMember("__uuid__");
    if (iter != _currentNode->MemberEnd()) {
        assert(iter->value.IsString());
        AssetDependInfo dependInfo;
        dependInfo.uuid = iter->value.GetString();
        dependInfo.owner = _currentOwner;
        dependInfo.propName = _currentKey;
        iter = _currentNode->FindMember("__expectedType__");
        if (iter != _currentNode->MemberEnd()) {
            assert(iter->value.IsString());
            dependInfo.expectedType = iter->value.GetString();
        }

        CC_LOG_DEBUG("Found __uuid__, owner: %p, current key: %s", _currentOwner, _currentKey);

        _depends.emplace_back(std::move(dependInfo));
        return &_depends.back();
    }

    return nullptr;
}

/* static */
void* JsonInputArchive::seObjGetPrivateData(se::Object* obj) {
    return obj->getPrivateData();
}

} // namespace cc
