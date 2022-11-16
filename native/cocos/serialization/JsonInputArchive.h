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

#pragma once

#include "IArchive.h"
#include "ISerializable.h"
#include "SerializationTrait.h"
#include "json/document.h"
#include "base/Ptr.h"

namespace cc {

class JsonInputArchive final : public IArchive {
public:
    JsonInputArchive();
    ~JsonInputArchive();

    bool isReading() const { return true; }
    bool isWritting() const { return false; }
    bool isExporting() const { return false; }

    ISerializable* start(const std::string& rootJsonStr, const ObjectFactory& factory);

    template<class T>
    void serializePrimitiveData(T& data);

    template<class T>
    void serializeString(T& data);

    template<class T>
    void serializeStlLikeArray(T& data);

    template<class T>
    void serializeStlLikeMap(T& data);

    template<class T>
    void serialize(T& data, const char* name);

    template<class T>
    void onStartSerialize(T& data);

    template<class T>
    void onFinishSerialize(T& data);

    inline void boolean(bool& data, const char* name) {
        serialize(data, name);
    }

    inline void int8(int8_t& data, const char* name) {
        serialize(data, name);
    }

    inline void int16(int16_t& data, const char* name) {
        serialize(data, name);
    }

    inline void int32(int32_t& data, const char* name) {
        serialize(data, name);
    }

    inline void int64(uint64_t& data, const char* name) {
        serialize(data, name);
    }

    inline void uint8(uint8_t& data, const char* name) {
        serialize(data, name);
    }

    inline void uint16(uint16_t& data, const char* name) {
        serialize(data, name);
    }

    inline void uint32(uint32_t& data, const char* name) {
        serialize(data, name);
    }

    inline void uint64(uint64_t& data, const char* name) {
        serialize(data, name);
    }

    inline void float32(float& data, const char* name) {
        serialize(data, name);
    }

    inline void float64(double& data, const char* name) {
        serialize(data, name);
    }

    inline void str(ccstd::string& data, const char* name) {
        serialize(data, name);
    }

private:

    const rapidjson::Value* getValue(const rapidjson::Value* parentNode, const char* key);

    rapidjson::Document _serializedData;
    const rapidjson::Value* _currentNode;
    ObjectFactory _objectFactory{nullptr};
};

template<>
inline void JsonInputArchive::serializePrimitiveData(bool& data) {
    if (_currentNode->IsBool()) {
        data = _currentNode->GetBool();
    } else if (_currentNode->IsNumber()) {
        data = _currentNode->GetDouble() != 0.0;
    } else if (_currentNode->IsString()) {
        data = 0 != strcmp("false", _currentNode->GetString());
    } else {
        data = false;
    }
}

template<>
inline void JsonInputArchive::serializePrimitiveData(int8_t& data) {
    if (_currentNode->IsInt()) {
        data = static_cast<int8_t>(_currentNode->GetInt());
    } else if (_currentNode->IsNumber()) {
        data = static_cast<int8_t>(_currentNode->GetDouble());
    } else if (_currentNode->IsString()) {
        data = static_cast<int8_t>(atoi(_currentNode->GetString()));
    } else {
        data = 0;
    }
}

template<>
inline void JsonInputArchive::serializePrimitiveData(int16_t& data) {
    if (_currentNode->IsInt()) {
        data = static_cast<int16_t>(_currentNode->GetInt());
    } else if (_currentNode->IsNumber()) {
        data = static_cast<int16_t>(_currentNode->GetDouble());
    } else if (_currentNode->IsString()) {
        data = static_cast<int16_t>(atoi(_currentNode->GetString()));
    } else {
        data = 0;
    }
}

template<>
inline void JsonInputArchive::serializePrimitiveData(int32_t& data) {
    if (_currentNode->IsInt()) {
        data = static_cast<int32_t>(_currentNode->GetInt());
    } else if (_currentNode->IsNumber()) {
        data = static_cast<int32_t>(_currentNode->GetDouble());
    } else if (_currentNode->IsString()) {
        data = static_cast<int32_t>(atoi(_currentNode->GetString()));
    } else {
        data = 0;
    }
}

template<>
inline void JsonInputArchive::serializePrimitiveData(int64_t& data) {
    if (_currentNode->IsInt()) {
        data = static_cast<int64_t>(_currentNode->GetInt64());
    } else if (_currentNode->IsString()) {
        data = static_cast<int64_t>(atol(_currentNode->GetString()));
    } else {
        data = 0;
    }
}

template<>
inline void JsonInputArchive::serializePrimitiveData(uint8_t& data) {
    if (_currentNode->IsUint()) {
        data = static_cast<uint8_t>(_currentNode->GetInt());
    } else if (_currentNode->IsNumber()) {
        data = static_cast<uint8_t>(_currentNode->GetDouble());
    } else if (_currentNode->IsString()) {
        data = static_cast<uint8_t>(atoi(_currentNode->GetString()));
    } else {
        data = 0;
    }
}

template<>
inline void JsonInputArchive::serializePrimitiveData(uint16_t& data) {
    if (_currentNode->IsUint()) {
        data = static_cast<uint16_t>(_currentNode->GetInt());
    } else if (_currentNode->IsNumber()) {
        data = static_cast<uint16_t>(_currentNode->GetDouble());
    } else if (_currentNode->IsString()) {
        data = static_cast<uint16_t>(atoi(_currentNode->GetString()));
    } else {
        data = 0;
    }
}

template<>
inline void JsonInputArchive::serializePrimitiveData(uint32_t& data) {
    if (_currentNode->IsUint()) {
        data = static_cast<uint32_t>(_currentNode->GetInt());
    } else if (_currentNode->IsNumber()) {
        data = static_cast<uint32_t>(_currentNode->GetDouble());
    } else if (_currentNode->IsString()) {
        data = static_cast<uint32_t>(atoi(_currentNode->GetString()));
    } else {
        data = 0;
    }
}

template<>
inline void JsonInputArchive::serializePrimitiveData(uint64_t& data) {
    if (_currentNode->IsUint64()) {
        data = static_cast<uint64_t>(_currentNode->GetInt64());
    } else if (_currentNode->IsString()) {
        data = static_cast<uint64_t>(atol(_currentNode->GetString()));
    } else {
        data = 0;
    }
}


template<>
inline void JsonInputArchive::serializePrimitiveData(float& data) {
    if (_currentNode->IsNumber()) {
        data = _currentNode->GetFloat();
    } else if (_currentNode->IsString()) {
        data = atof(_currentNode->GetString());
    } else {
        data = 0.F;
    }
}

template<>
inline void JsonInputArchive::serializePrimitiveData(double& data) {
    if (_currentNode->IsNumber()) {
        data = _currentNode->GetDouble();
    } else if (_currentNode->IsString()) {
        data = atof(_currentNode->GetString());
    } else {
        data = 0.0;
    }
}

template<>
inline void JsonInputArchive::serializeString(ccstd::string& data) {
    if (_currentNode->IsString()) {
        data = _currentNode->GetString();
    } else {
        data.clear();
    }
}

template<class T>
inline void JsonInputArchive::serializeStlLikeArray(T& data) {
    if (!_currentNode->IsArray()) {
        return;
    }

    auto* parentNode = _currentNode;
    const auto& arr = _currentNode->GetArray();
    uint32_t len = arr.Size();

    SerializationTrait<T>::resizeStlLikeArray(data, len);

    for (uint32_t i = 0; i < len; ++i) {
        const auto& e = arr[i];
        _currentNode = &e;

        if (_currentNode != nullptr) {
            SerializationTrait<typename T::value_type>::serialize(data[i], *this);
        }
    }

    _currentNode = parentNode;
}

template<class T>
void JsonInputArchive::serializeStlLikeMap(T& data) {
    using key_type = typename T::key_type;
    using mapped_type = typename T::mapped_type;

    if (!_currentNode->IsObject()) {
        return;
    }

    auto* parentNode = _currentNode;
    const auto& obj = _currentNode->GetObject();

    SerializationTrait<T>::reserveStlLikeMap(data, obj.MemberCount());

    for (const auto& e : obj) {
        _currentNode = &e.name;
        if (_currentNode == nullptr) {
            continue;
        }
        key_type key;
        SerializationTrait<key_type>::serialize(key, *this);

        _currentNode = &e.value;
        if (_currentNode == nullptr) {
            continue;
        }
        mapped_type value;
        SerializationTrait<mapped_type>::serialize(value, *this);

        data[key] = value;
    }

    _currentNode = parentNode;
}

template<class T>
inline void JsonInputArchive::serialize(T& data, const char* name) {
    auto* parentNode = _currentNode;

    _currentNode = getValue(parentNode, name);

    if (_currentNode != nullptr) {
        SerializationTrait<T>::serialize(data, *this);
    }

    _currentNode = parentNode;
}

template<class T>
inline void JsonInputArchive::onStartSerialize(T& data) {
    if (!_currentNode->IsObject()) {
        return;
    }

    rapidjson::Value::ConstMemberIterator iter = _currentNode->FindMember("__type__");
    if (iter == _currentNode->MemberEnd()) {
        return;
    }

    if (!iter->value.IsString()) {
        return;
    }

    const auto* type = iter->value.GetString();
    ISerializable* obj = _objectFactory(type);

    static_assert(std::is_pointer_v<T> || IsIntrusivePtr<T>::value, "Wrong pointer type");

    if constexpr (std::is_pointer_v<T>) {
        data = static_cast<T>(obj);
    } else if constexpr (IsIntrusivePtr<T>::value) {
        data = static_cast<std::add_pointer_t<typename IsIntrusivePtr<T>::type>>(obj);
    }
}

template<class T>
inline void JsonInputArchive::onFinishSerialize(T& data) {

}

}
