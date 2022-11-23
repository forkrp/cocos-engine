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

se::Object* JsonInputArchive::getOrCreateScriptObject() {
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
            return cachedMapIter->second;
        }

        _currentNode = &_serializedData[index];
        type = findTypeInJsonObject(*_currentNode);

        if (nullptr == type) {
            return nullptr;
        }
    }

    se::Object* obj = _objectFactory->createScriptObject(type);

    if (index >= 0) {
        assert(_deserializedObjIdMap.find(index) == _deserializedObjIdMap.end());
        _deserializedObjIdMap[index] = obj;
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
    return value;
}

se::Value& JsonInputArchive::serializableObj(se::Value& value, const char* name) {
    return value;
}

se::Value& JsonInputArchive::serializableObjArray(se::Value& value, const char* name) {
    return value;
}

se::Value& JsonInputArchive::serializeArray(se::Value& value, const char* name) {
    return value;
}

se::Value& JsonInputArchive::serializeInternal(se::Value& value, const char* name) {
    auto iter = _currentNode->FindMember(name);
    if (iter == _currentNode->MemberEnd()) {
        value.setUndefined();
        return value;
    }
    const auto& data = iter->value;

    switch (iter->value.GetType()) {
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
                value = anyValue(value, name);
            }
            break;
        case rapidjson::kArrayType:
            serializeArray(value, name);
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

} // namespace cc
