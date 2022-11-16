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

namespace cc {

JsonInputArchive::JsonInputArchive() {
}

JsonInputArchive::~JsonInputArchive() {
}

ISerializable* JsonInputArchive::start(const std::string& rootJsonStr, const ObjectFactory& factory) {
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

    const char * type = findTypeInJsonObject(*_currentNode);
    ISerializable* obj = _objectFactory(type);
    if (!obj) {
        return nullptr;
    }

    obj->virtualSerialize(*this);
    return obj;
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

} // namespace cc
