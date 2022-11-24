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

se::Object* JsonInputArchive::start(const std::string& rootJsonStr, ObjectFactory* factory) {
    assert(factory != nullptr);
    _objectFactory = factory;

    rapidjson::Document d;
    d.Parse(rootJsonStr.c_str());
    if (d.HasParseError()) {
        return nullptr;
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

    const char* type = findTypeInJsonObject(*_currentNode);

    se::Object* ret = _objectFactory->createScriptObject(type);
    assert(ret);

    ret->root();

    _previousOwner = nullptr;
    _currentOwner = ret;

    // Serialize CPP object
    ret->getPrivateObject()->serialize(*this);

    // Serialize JS object
    serializeScriptObject(ret);

    ret->unroot();
    return ret;
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
        return;
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

void* JsonInputArchive::seObjectGetPrivateData(se::Object* obj) {
    obj->getPrivateData();
}

void JsonInputArchive::seObjectRoot(se::Object* obj) {
    obj->root();
}

void JsonInputArchive::seObjectUnroot(se::Object* obj) {
    obj->unroot();
}

se::Value& JsonInputArchive::anyValue(se::Value& value, const char* name) {
    return serializeInternal(value, name);
}

se::Value& JsonInputArchive::plainObj(se::Value& value, const char* name) {
    auto* parentNode = _currentNode;
    _currentNode = getValue(parentNode, name);

    if (_currentNode != nullptr) {
        if (_currentNode->IsObject()) {
            se::Object* seObj = nullptr;
            bool needRelease = false;
            if (value.isObject()) {
                seObj = value.toObject();
            } else {
                seObj = se::Object::createPlainObject();
                seObj->root();
                needRelease = true;
            }

            const auto& curJSONObj = _currentNode->GetObject();
            for (const auto& e : curJSONObj) {
                assert(e.name.IsString());
                const auto* subParentNode = _currentNode;

                se::Value seValue;
                seValue = anyValue(seValue, e.name.GetString());
                seObj->setProperty(e.name.GetString(), seValue);

                _currentNode = subParentNode;
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
    return value;
}

void JsonInputArchive::doSerializeObj(se::Value& value) {
    if (_currentNode != nullptr) {
        se::Object* scriptObject{nullptr};
        void* obj = getOrCreateNativeObjectReturnVoidPtr(scriptObject);
        if (scriptObject != nullptr) {
            if (std::find(_deserializedObjects.cbegin(), _deserializedObjects.cend(), obj) == _deserializedObjects.cend()) {
                scriptObject->getPrivateObject()->serialize(*this);
            } else {
                CC_LOG_DEBUG("serializableObj return from cache, scriptObject: %p", scriptObject);
            }

            value.setObject(scriptObject);
        }
    }
}

se::Value& JsonInputArchive::serializableObj(se::Value& value, const char* name) {
    auto* parentNode = _currentNode;
    _currentNode = getValue(parentNode, name);

    doSerializeObj(value);

    _currentNode = parentNode;
    return value;
}

void JsonInputArchive::doSerializeArray(se::Value& value) {
    if (_currentNode != nullptr) {
        if (_currentNode->IsArray()) {
            se::Object* seObj = nullptr;
            bool needRelease = false;
            if (value.isObject() && value.toObject()->isArray()) {
                seObj = value.toObject();
            } else {
                seObj = se::Object::createArrayObject(_currentNode->GetArray().Size());
                seObj->root();
                needRelease = true;
            }

            uint32_t i = 0;
            for (const auto& e : _currentNode->GetArray()) {
                const auto* parentNode = _currentNode;
                _currentNode = &e;
                se::Value seValue;
                doSerializeAny(seValue);
                seObj->setArrayElement(i, seValue);
                _currentNode = parentNode;
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
    _currentNode = getValue(parentNode, name);

    if (_currentNode != nullptr) {
        if (_currentNode->IsArray()) {
            se::Object* seObj = nullptr;
            bool needRelease = false;
            if (value.isObject() && value.toObject()->isArray()) {
                seObj = value.toObject();
            } else {
                seObj = se::Object::createArrayObject(_currentNode->GetArray().Size());
                seObj->root();
                needRelease = true;
            }

            uint32_t i = 0;
            for (const auto& e : _currentNode->GetArray()) {
                const auto* parentNode = _currentNode;
                _currentNode = &e;
                se::Value seValue;
                doSerializeObj(seValue);
                seObj->setArrayElement(i, seValue);
                _currentNode = parentNode;
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
    return value;
}

se::Value& JsonInputArchive::arrayObj(se::Value& value, const char* name) {
    auto* parentNode = _currentNode;
    _currentNode = getValue(parentNode, name);

    doSerializeArray(value);

    _currentNode = parentNode;
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

se::Value& JsonInputArchive::serializeInternal(se::Value& value, const char* name) {
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

} // namespace cc
