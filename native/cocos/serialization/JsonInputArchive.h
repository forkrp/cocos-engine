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

#include "AssetDependInfo.h"
#include "HasMemberFunction.h"
#include "IArchive.h"
#include "ISerializable.h"
#include "SerializationTrait.h"
#include "base/Ptr.h"
#include "core/data/Object.h"
#include "json/document.h"

#include "base/std/container/vector.h"

namespace se {
class Value;
}

namespace cc {

class JsonInputArchive final : public IArchive {
public:
    JsonInputArchive();
    ~JsonInputArchive();

    bool isReading() const { return true; }
    bool isWritting() const { return false; }
    bool isExporting() const { return false; }

    se::Object* start(const std::string& rootJsonStr, ObjectFactory* factory);

    template <class T>
    void serializePrimitiveData(T& data);

    template <class T>
    void serializeString(T& data);

    template <class T>
    void serializeStlLikeArray(T& data);

    template <class T>
    void serializeStlLikeMap(T& data);

    template <class T>
    void serialize(T& data, const char* name);

    template <class T>
    void onSerializingObjectPtr(T& data);

    template <class T>
    void onSerializingObjectIntrusivePtr(T& data);

    template <class T>
    void onSerializingObjectRef(T& data);

    template <class T>
    void onStartSerializeObject(T& data);

    template <class T>
    void onFinishSerializeObject(T& data);

    inline bool boolean(bool& data, const char* name) {
        serialize(data, name);
        return data;
    }

    inline int8_t int8(int8_t& data, const char* name) {
        serialize(data, name);
        return data;
    }

    inline int16_t int16(int16_t& data, const char* name) {
        serialize(data, name);
        return data;
    }

    inline int32_t int32(int32_t& data, const char* name) {
        serialize(data, name);
        return data;
    }

    inline int64_t int64(int64_t& data, const char* name) {
        serialize(data, name);
        return data;
    }

    inline uint8_t uint8(uint8_t& data, const char* name) {
        serialize(data, name);
        return data;
    }

    inline uint16_t uint16(uint16_t& data, const char* name) {
        serialize(data, name);
        return data;
    }

    inline uint32_t uint32(uint32_t& data, const char* name) {
        serialize(data, name);
        return data;
    }

    inline uint64_t uint64(uint64_t& data, const char* name) {
        serialize(data, name);
        return data;
    }

    inline float float32(float& data, const char* name) {
        serialize(data, name);
        return data;
    }

    inline double float64(double& data, const char* name) {
        serialize(data, name);
        return data;
    }

    inline ccstd::string& str(ccstd::string& data, const char* name) {
        serialize(data, name);
        return data;
    }

    se::Value& anyValue(se::Value& value, const char* name);
    se::Value& plainObj(se::Value& value, const char* name);
    se::Value& arrayObj(se::Value& value, const char* name);
    se::Value& serializableObj(se::Value& value, const char* name);
    se::Value& serializableObjArray(se::Value& value, const char* name);

private:
    const rapidjson::Value* getValue(const rapidjson::Value* parentNode, const char* key);
    static const char* findTypeInJsonObject(const rapidjson::Value& jsonObj);

    template<class T>
    T getOrCreateNativeObject(se::Object*& outScriptObject);

    void* getOrCreateNativeObjectReturnVoidPtr(se::Object*& outScriptObject);

    void* seObjectGetPrivateData(se::Object* obj);
    void seObjectRoot(se::Object* obj);
    void seObjectUnroot(se::Object* obj);

    se::Value& serializeInternal(se::Value& value, const char* name);

    void doSerializeObj(se::Value& value);
    void doSerializeArray(se::Value& value);
    void doSerializeAny(se::Value& value);

    void serializeScriptObject(se::Object* obj);
    void serializeScriptObjectByNativePtr(void* nativeObj);

    rapidjson::Document _serializedData;
    const rapidjson::Value* _currentNode;
    ObjectFactory* _objectFactory{nullptr};

    struct DeserializedInfo final {
        int32_t index{0};
        void* nativeObj{nullptr};
        se::Object* scriptObj{nullptr};
    };

    ccstd::unordered_map<int32_t, DeserializedInfo> _deserializedObjIdMap;
    ccstd::vector<void*> _deserializedObjects;

    ccstd::vector<AssetDependInfo> _depends;

    se::Object* _previousOwner{nullptr};
    se::Object* _currentOwner{nullptr};
    bool _isRoot{true};
};

template <>
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

template <>
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

template <>
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

template <>
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

template <>
inline void JsonInputArchive::serializePrimitiveData(int64_t& data) {
    if (_currentNode->IsInt()) {
        data = static_cast<int64_t>(_currentNode->GetInt64());
    } else if (_currentNode->IsString()) {
        data = static_cast<int64_t>(atol(_currentNode->GetString()));
    } else {
        data = 0;
    }
}

template <>
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

template <>
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

template <>
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

template <>
inline void JsonInputArchive::serializePrimitiveData(uint64_t& data) {
    if (_currentNode->IsUint64()) {
        data = static_cast<uint64_t>(_currentNode->GetInt64());
    } else if (_currentNode->IsString()) {
        data = static_cast<uint64_t>(atol(_currentNode->GetString()));
    } else {
        data = 0;
    }
}

template <>
inline void JsonInputArchive::serializePrimitiveData(float& data) {
    if (_currentNode->IsNumber()) {
        data = _currentNode->GetFloat();
    } else if (_currentNode->IsString()) {
        data = atof(_currentNode->GetString());
    } else {
        data = 0.F;
    }
}

template <>
inline void JsonInputArchive::serializePrimitiveData(double& data) {
    if (_currentNode->IsNumber()) {
        data = _currentNode->GetDouble();
    } else if (_currentNode->IsString()) {
        data = atof(_currentNode->GetString());
    } else {
        data = 0.0;
    }
}

template <>
inline void JsonInputArchive::serializeString(ccstd::string& data) {
    if (_currentNode->IsString()) {
        data = _currentNode->GetString();
    } else {
        data.clear();
    }
}

template <class T>
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

template <class T>
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

template <class T>
inline void JsonInputArchive::serialize(T& data, const char* name) {
    auto* parentNode = _currentNode;

    _currentNode = getValue(parentNode, name);

    if (_currentNode != nullptr) {
        SerializationTrait<T>::serialize(data, *this);
    }

    _currentNode = parentNode;
}

template <class T>
void JsonInputArchive::onSerializingObjectPtr(T& data) {
    // Return directly since the object has already been deserialized.
    if (std::find(_deserializedObjects.cbegin(), _deserializedObjects.cend(), data) != _deserializedObjects.cend()) {
        return;
    }

    using data_type = std::remove_const_t<typename IsPtr<T>::type>;
    bool isRoot = _isRoot;
    _isRoot = false;
    if constexpr (has_serialize<data_type, void(decltype(*this)&)>::value && has_serializeInlineData<data_type, void(decltype(*this)&)>::value) {
        if (isRoot) {
            data->serialize(*this);
        } else {
            data->serializeInlineData(*this);
        }
    } else if constexpr (has_serialize<data_type, void(decltype(*this)&)>::value) {
        data->serialize(*this);
    } else if constexpr (has_serializeInlineData<data_type, void(decltype(*this)&)>::value) {
        data->serializeInlineData(*this);
    }

    if constexpr (has_script_object<data_type>::value) {
        se::Object* scriptObject = data->getScriptObject();
        serializeScriptObject(scriptObject);
    } else {
        serializeScriptObjectByNativePtr(data);
    }

    _deserializedObjects.emplace_back(data);
}

template <class T>
void JsonInputArchive::onSerializingObjectRef(T& data) {
    using data_type = std::decay_t<T>;
    bool isRoot = _isRoot;
    _isRoot = false;
    if constexpr (has_serialize<data_type, void(decltype(*this)&)>::value && has_serializeInlineData<data_type, void(decltype(*this)&)>::value) {
        if (isRoot) {
            data.serialize(*this);
        } else {
            data.serializeInlineData(*this);
        }
    } else if constexpr (has_serialize<data_type, void(decltype(*this)&)>::value) {
        data.serialize(*this);
    } else if constexpr (has_serializeInlineData<data_type, void(decltype(*this)&)>::value) {
        data.serializeInlineData(*this);
    }

    if constexpr (has_script_object<data_type>::value) {
        se::Object* scriptObject = data.getScriptObject();
        serializeScriptObject(scriptObject);
    } else {
        serializeScriptObjectByNativePtr(&data);
    }
}

template <class T>
inline void JsonInputArchive::onStartSerializeObject(T& data) {
    se::Object* scriptObject{nullptr};
    if constexpr (IsPtr<T>::value) {
        using value_type = typename IsPtr<T>::type;
        assert(data == nullptr);//, "Raw ptr should be nullptr in new serialization system");
        value_type* obj = getOrCreateNativeObject<value_type*>(scriptObject);
        data = obj;
        if constexpr (has_script_object<value_type>::value) {
            data->setScriptObject(scriptObject);
        }
    } else {
        if constexpr (has_script_object<T>::value) {
            data->setScriptObject(scriptObject);
        }
    }
}

template <class T>
inline void JsonInputArchive::onFinishSerializeObject(T& data) {
    if (_previousOwner != nullptr) {
        _currentOwner = _previousOwner;
        _previousOwner = nullptr;
    }
}

template<class T>
inline T JsonInputArchive::getOrCreateNativeObject(se::Object*& outScriptObject) {
//    static_assert(std::is_base_of<CCObject, T>::value, "Native object should be inherited from CCObject");
    return reinterpret_cast<T>(getOrCreateNativeObjectReturnVoidPtr(outScriptObject));
}

} // namespace cc

/*
 auto iter = _currentNode->FindMember("__uuid__");
 if (iter != _currentNode->MemberEnd()) {
     assert(iter->value.IsString());
     AssetDependInfo dependInfo;
     dependInfo.owner = _currentOwner;
     dependInfo.propNameOrIndex = name;
     dependInfo.uuid = iter->value.GetString();
     iter = _currentNode->FindMember("__expectedType__");
     if (iter != _currentNode->MemberEnd()) {
         assert(iter->value.IsString());
         dependInfo.expectedType = iter->value.GetString();
     }

     _depends.emplace_back(std::move(dependInfo));
 } else {
 */
