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

    se::Value start(const std::string& rootJsonStr, ObjectFactory* factory);

    inline const std::vector<AssetDependInfo>& getDepends() const { return _depends; } // TODO(cjh): Should not handle dependency in Serialization module

#ifndef SWIGCOCOS
    template <class T>
    void serialize(T& data, const char* name);
    
    template <class T, uint32_t count>
    void serializePrimitiveDataWithCount(T* data);

    // Used internally.
    template <class T>
    void serializePrimitiveData(T& data);

    template <class T>
    void serializeString(T& data);

    template <class T>
    void serializeStlLikeArray(T& data);

    template <class T>
    void serializeStlLikeMap(T& data);

    template <class T>
    void serializeOptional(ccstd::optional<T>& data);

    template <class... Args>
    void serializeStdTuple(std::tuple<Args...>& data);

    template <class T>
    void serializeObject(T& data);

    template <class T>
    void onSerializingObjectPtr(T& data);
    template <class T>
    void onFinishSerializeObject(T& data);
#endif // SWIGCOCOS

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

    inline const rapidjson::Value* getCurrentNode() const { return _currentNode; }
    inline void setCurrentNode(const rapidjson::Value* node) { _currentNode = node; }

private:
    template <class T>
    void onSerializingObjectRef(T& data);

    template <class T>
    bool onStartSerializeObject(T& data);

    const rapidjson::Value* getValue(const rapidjson::Value* parentNode, const char* key);
    static const char* findTypeInJsonObject(const rapidjson::Value& jsonObj);

    template <class T>
    T getOrCreateNativeObject(se::Object*& outScriptObject);

    void* getOrCreateNativeObjectReturnVoidPtr(se::Object*& outScriptObject);

    void doSerializeObj(se::Value& value);
    void doSerializeArray(se::Value& value);
    void doSerializeAny(se::Value& value);

    void serializeScriptObject(se::Object* obj);
    void serializeScriptObjectByNativePtr(const void* nativeObj);

    void onAfterDeserializeScriptObject(se::Object* obj);
    void onAfterDeserializeScriptObjectByNativePtr(const void* nativeObj);

    AssetDependInfo* checkAssetDependInfo();
    static void* seObjGetPrivateData(se::Object* obj);

    rapidjson::Document _serializedData;
    const rapidjson::Value* _currentNode;
    ObjectFactory* _objectFactory{nullptr};

    struct DeserializedInfo final {
        int32_t index{0};
        void* nativeObj{nullptr};
        se::Object* scriptObj{nullptr};
    };

    ccstd::unordered_map<int32_t, DeserializedInfo> _deserializedObjIdMap;
    ccstd::vector<const void*> _deserializedObjects;

    ccstd::vector<AssetDependInfo> _depends;

    se::Object* _currentOwner{nullptr}; // TODO(cjh): Remove _currentOwner after dependency code is removed from JsonInputArchive
    const char* _currentKey{nullptr};

    bool _isRoot{true};
};

#ifndef SWIGCOCOS

template <class T, uint32_t count>
inline void JsonInputArchive::serializePrimitiveDataWithCount(T* data) {
    assert(false); //TODO(cjh):
}

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
    } else if (_currentNode->IsBool()) {
        data = _currentNode->GetBool() ? 1 : 0;
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
    } else if (_currentNode->IsBool()) {
        data = _currentNode->GetBool() ? 1 : 0;
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
    } else if (_currentNode->IsBool()) {
        data = _currentNode->GetBool() ? 1 : 0;
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
    } else if (_currentNode->IsNumber()) {
        data = static_cast<int64_t>(_currentNode->GetDouble());
    } else if (_currentNode->IsBool()) {
        data = _currentNode->GetBool() ? 1 : 0;
    } else if (_currentNode->IsString()) {
        data = static_cast<int64_t>(atol(_currentNode->GetString()));
    } else {
        data = 0;
    }
}

template <>
inline void JsonInputArchive::serializePrimitiveData(uint8_t& data) {
    if (_currentNode->IsUint()) {
        data = static_cast<uint8_t>(_currentNode->GetUint());
    } else if (_currentNode->IsNumber()) {
        data = static_cast<uint8_t>(_currentNode->GetDouble());
    } else if (_currentNode->IsBool()) {
        data = _currentNode->GetBool() ? 1 : 0;
    } else if (_currentNode->IsString()) {
        data = static_cast<uint8_t>(atoi(_currentNode->GetString()));
    } else {
        data = 0;
    }
}

template <>
inline void JsonInputArchive::serializePrimitiveData(uint16_t& data) {
    if (_currentNode->IsUint()) {
        data = static_cast<uint16_t>(_currentNode->GetUint());
    } else if (_currentNode->IsNumber()) {
        data = static_cast<uint16_t>(_currentNode->GetDouble());
    } else if (_currentNode->IsBool()) {
        data = _currentNode->GetBool() ? 1 : 0;
    } else if (_currentNode->IsString()) {
        data = static_cast<uint16_t>(atoi(_currentNode->GetString()));
    } else {
        data = 0;
    }
}

template <>
inline void JsonInputArchive::serializePrimitiveData(uint32_t& data) {
    if (_currentNode->IsUint()) {
        data = static_cast<uint32_t>(_currentNode->GetUint());
    } else if (_currentNode->IsNumber()) {
        data = static_cast<uint32_t>(_currentNode->GetDouble());
    } else if (_currentNode->IsBool()) {
        data = _currentNode->GetBool() ? 1 : 0;
    } else if (_currentNode->IsString()) {
        data = static_cast<uint32_t>(atoi(_currentNode->GetString()));
    } else {
        data = 0;
    }
}

template <>
inline void JsonInputArchive::serializePrimitiveData(uint64_t& data) {
    if (_currentNode->IsUint64()) {
        data = static_cast<uint64_t>(_currentNode->GetUint64());
    } else if (_currentNode->IsNumber()) {
        data = static_cast<uint64_t>(_currentNode->GetDouble());
    } else if (_currentNode->IsBool()) {
        data = _currentNode->GetBool() ? 1 : 0;
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
    using data_type = typename T::value_type;

    if (!_currentNode->IsArray()) {
        return;
    }

    auto* parentNode = _currentNode;
    const char* oldKey = _currentKey;
    auto* oldOwner = _currentOwner;

    _currentOwner = nullptr; // Stl container should not be a script owner.

    const auto& arr = _currentNode->GetArray();
    uint32_t len = arr.Size();

    SerializationTrait<T>::resizeStlLikeArray(data, len);

    char keyTmp[12] = {0};

    for (uint32_t i = 0; i < len; ++i) {
        const auto& e = arr[i];
        _currentNode = &e;
        snprintf(keyTmp, sizeof(keyTmp), "%u", i);
        _currentKey = keyTmp;

        if (_currentNode != nullptr) {
            if constexpr (std::is_same_v<bool, data_type>) {
                data_type v{};
                SerializationTrait<data_type>::serialize(v, *this);
                data[i] = v;
            } else {
                SerializationTrait<data_type>::serialize(data[i], *this);
            }
        }
    }

    _currentNode = parentNode;
    _currentKey = oldKey;
    _currentOwner = oldOwner;
}

template <class T>
void JsonInputArchive::serializeStlLikeMap(T& data) {
    using key_type = typename T::key_type;
    using mapped_type = typename T::mapped_type;

    if (!_currentNode->IsObject()) {
        return;
    }

    auto* parentNode = _currentNode;
    const char* oldKey = _currentKey;
    auto* oldOwner = _currentOwner;

    _currentOwner = nullptr; // Stl container should not be a script owner.

    const auto& obj = _currentNode->GetObject();

    SerializationTrait<T>::reserveStlLikeMap(data, obj.MemberCount());

    char keyTmp[12] = {0};

    for (const auto& e : obj) {
        _currentNode = &e.name;
        _currentKey = nullptr; // FIXME(cjh): Should be nullptr for key itself?
        if (_currentNode == nullptr) {
            continue;
        }
        key_type key{};
        SerializationTrait<key_type>::serialize(key, *this);

        _currentNode = &e.value;
        if constexpr (std::numeric_limits<key_type>::is_integer) {
            snprintf(keyTmp, sizeof(keyTmp), "%d", static_cast<int32_t>(key));
            _currentKey = keyTmp;
        } else if constexpr (std::is_same_v<std::decay_t<key_type>, ccstd::string>) {
            _currentKey = key.c_str();
        } else {
            static_assert(std::is_same_v<key_type, void>, "Not supported key type");
        }

        if (_currentNode == nullptr) {
            continue;
        }
        mapped_type value{};
        SerializationTrait<mapped_type>::serialize(value, *this);

        data[key] = value;
    }

    _currentNode = parentNode;
    _currentKey = oldKey;
    _currentOwner = oldOwner;
}

template <class T>
inline void JsonInputArchive::serializeOptional(ccstd::optional<T>& data) {
    if (!_currentNode || _currentNode->IsNull()) {
        return;
    }

    T serializedData{};
    SerializationTrait<T>::serialize(serializedData, *this);
    data = std::move(serializedData);
}

template <typename Tuple, typename Func, size_t... N>
void func_call_tuple(Tuple& t, Func&& func, std::index_sequence<N...>) {
    static_cast<void>(std::initializer_list<int>{(func(std::get<N>(t)), 0)...});
}

template <typename... Args, typename Func>
void travel_tuple(std::tuple<Args...>& t, Func&& func) {
    func_call_tuple(t, std::forward<Func>(func), std::make_index_sequence<sizeof...(Args)>{});
}

template <class... Args>
inline void JsonInputArchive::serializeStdTuple(std::tuple<Args...>& data) {
    static constexpr size_t ARG_N = sizeof...(Args);

    if (!_currentNode->IsArray()) {
        return;
    }

    auto* parentNode = _currentNode;
    const char* oldKey = _currentKey;
    auto* oldOwner = _currentOwner;

    _currentOwner = nullptr; // Stl container should not be a script owner.
    _currentKey = nullptr;

    const auto& arr = _currentNode->GetArray();
    uint32_t len = arr.Size();
    assert(len == ARG_N);

    uint32_t i = 0;
    travel_tuple(data, [&](auto&& item) {
        _currentNode = &arr[i];

        using data_type = std::decay_t<decltype(item)>;
        SerializationTrait<data_type>::serialize(item, *this);

        ++i;
    });

    _currentNode = parentNode;
    _currentKey = oldKey;
    _currentOwner = oldOwner;
}

template <class T>
inline void JsonInputArchive::serialize(T& data, const char* name) {
    auto* parentNode = _currentNode;
    const char* oldKey = _currentKey;
    auto* oldOwner = _currentOwner;

    _currentNode = getValue(parentNode, name);
    _currentKey = name;

    if (_currentNode != nullptr) {
        SerializationTrait<T>::serialize(data, *this);
    }

    _currentNode = parentNode;
    _currentKey = oldKey;
    _currentOwner = oldOwner;
}

template <class T>
inline void JsonInputArchive::serializeObject(T& data) {
    if (!onStartSerializeObject(data)) {
        return;
    }

    if constexpr (IsPtr<std::decay_t<T>>::value) {
        if (data != nullptr) {
            onSerializingObjectPtr(data);
        }
    } else {
        onSerializingObjectRef(data);
    }
    onFinishSerializeObject(data);
}

template <class T>
inline void JsonInputArchive::onSerializingObjectPtr(T& data) {
    using data_type = std::remove_const_t<typename IsPtr<T>::type>;
    // Return directly since the object has already been deserialized.
    auto iter = std::find(_deserializedObjects.cbegin(), _deserializedObjects.cend(), data);
    if (iter != _deserializedObjects.cend()) {
        data = reinterpret_cast<data_type*>(const_cast<void*>(*iter));
        return;
    }
    _deserializedObjects.emplace_back(data);

    // Serialize CPP object
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

    // Serialize JS object
    if constexpr (has_getScriptObject<data_type, void(se::Object*)>::value) {
        se::Object* scriptObject = data->getScriptObject();
        serializeScriptObject(scriptObject);
    } else {
        serializeScriptObjectByNativePtr(data);
    }
}

template <class T>
inline void JsonInputArchive::onSerializingObjectRef(T& data) {
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
    } else {
        static_assert(std::is_void_v<T>, "CPP type doesn't have a serialize or serializeInlineData method");
    }

    if constexpr (has_getScriptObject<data_type, se::Object*()>::value) {
        se::Object* scriptObject = data.getScriptObject();
        serializeScriptObject(scriptObject);
    } else {
        serializeScriptObjectByNativePtr(&data);
    }
}

template <class T>
inline bool JsonInputArchive::onStartSerializeObject(T& data) {
    se::Object* scriptObject{nullptr};
    if constexpr (IsPtr<T>::value) {
        using value_type = typename IsPtr<T>::type;
        //        assert(data == nullptr); //, "Raw ptr should be nullptr in new serialization system");

        AssetDependInfo* dependInfo{nullptr};
        if constexpr (has_setUuid<value_type, void(const ccstd::string&)>::value) {
            dependInfo = checkAssetDependInfo();
            if (dependInfo != nullptr) {
                dependInfo->dereferenceCb = [&data](se::Object* seDataObj) {
                    data = reinterpret_cast<value_type*>(seObjGetPrivateData(seDataObj));
//                    data->setUuid(uuid);

                    if constexpr (has_setScriptObject<value_type, void(se::Object*)>::value) {
                        data->setScriptObject(seDataObj);
                    }
                };
                return false;
            }
        }

        value_type* obj = getOrCreateNativeObject<value_type*>(scriptObject);
        data = obj;
        _currentOwner = scriptObject;

        if (dependInfo != nullptr) {
            dependInfo->owner = scriptObject; // FIXME(cjh): Weak refernce ? Need to root?
        }

        if constexpr (has_setScriptObject<value_type, void(se::Object*)>::value) {
            if (data != nullptr) {
                data->setScriptObject(scriptObject);
            }
        }
    }

    return true;
}

template <class T>
inline void JsonInputArchive::onFinishSerializeObject(T& data) {
    if constexpr (IsPtr<T>::value) {
        using value_type = typename IsPtr<T>::type;

        if constexpr (has_onAfterDeserialize<value_type, void()>::value) {
            data->onAfterDeserialize();
        }

        if (data != nullptr) {
            if constexpr (has_setScriptObject<value_type, void(se::Object*)>::value) {
                se::Object* scriptObject = data->getScriptObject();
                onAfterDeserializeScriptObject(scriptObject);
            } else {
                onAfterDeserializeScriptObjectByNativePtr(data);
            }
        }
    }
}

template <class T>
inline T JsonInputArchive::getOrCreateNativeObject(se::Object*& outScriptObject) {
    //    static_assert(std::is_base_of<CCObject, T>::value, "Native object should be inherited from CCObject");
    return reinterpret_cast<T>(getOrCreateNativeObjectReturnVoidPtr(outScriptObject));
}

#endif // SWIGCOCOS

} // namespace cc
