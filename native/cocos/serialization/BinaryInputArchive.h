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
#include "SerializationData.h"

#include "base/std/container/vector.h"
#include "math/Vec3.h"
#include "math/Vec4.h"
#include "math/Quaternion.h"

#include "bindings/utils/BindingUtils.h"

#include <stack>

namespace se {
class Value;
}

namespace cc {

// TODO(cjh): Move to utils
enum SerializeTag {
    TAG_UNDEFINED = 0,
    TAG_NULL,
    TAG_NUMBER,
    TAG_BOOLEAN,
    TAG_STRING,
    TAG_SERIALIZABLE_OBJECT,
    TAG_MAP,
    TAG_ARRAY
};

enum ObjectKindFlag {
    OBJECT_KIND_FLAG_NULL = (1 << 0),
    OBJECT_KIND_FLAG_INLINE = (1 << 1)
};

class DeserializeNode final {
public:
    DeserializeNode(const ccstd::string &name, uint8_t *buffer, uint32_t bufferByteLength);

    inline const ccstd::string &getName() const { return _name; }

    inline uint32_t getOffset() const { return _offset; }
    inline void setOffset(uint32_t offset) { _offset = offset; }

    inline uint32_t getDataByteLength() const { return _data.getByteLength(); };

    std::pair<uint32_t, uint32_t> popDependTargetInfo();

    int32_t popArrayTagAndReturnLength();
    void popMapTag();

    inline bool popBoolean() {
        bool ret = _data.get<uint8_t>(_offset) != 0;
        ++_offset;
        return ret;
    }

    inline int8_t popInt8() {
        return popNumber<int8_t>();
    }

    inline int16_t popInt16() {
        return popNumber<int16_t>();
    }

    inline int32_t popInt32() {
        return popNumber<int32_t>();
    }

    inline int64_t popInt64() {
        return popNumber<int64_t>();
    }

    inline uint8_t popUint8() {
        return popNumber<uint8_t>();
    }

    inline uint16_t popUint16() {
        return popNumber<uint16_t>();
    }

    inline uint32_t popUint32() {
        return popNumber<uint32_t>();
    }

    inline uint64_t popUint64() {
        return popNumber<uint64_t>();
    }

    inline float popFloat32() {
        return popNumber<float>();
    }

    inline double popFloat64() {
        return popNumber<double>();
    }

    inline std::string_view popString() {
        auto strLength = _data.get<uint32_t>(_offset);
        auto ret = _data.getString(_offset + 4, strLength);
        _offset += ret.length() + 1 + 4; // 4 is how many bytes of string.
        return ret;
    }

    template <typename T>
    T popNumber() {
        T ret = _data.get<T>(_offset);
        _offset += sizeof(T);
        return ret;
    }
    
    template <typename T, uint32_t totalBytes>
    T* popMemory() {
        T* ret = _data.getPointer<T, totalBytes>(_offset);
        _offset += totalBytes;
        return ret;
    }

private:
    SerializationData _data;
    uint32_t _offset{0};
    ccstd::string _name;
    
    friend class BinaryInputArchive;
};

template <typename T>
class TypedArrayTemp;

class BinaryInputArchive final : public IArchive {
public:
    BinaryInputArchive();
    ~BinaryInputArchive();

    bool isReading() const { return true; }
    bool isWritting() const { return false; }
    bool isExporting() const { return false; }

    se::Value start(TypedArrayTemp<uint8_t> &&bufferView, ObjectFactory* factory);
    
    void setScriptArchive(se::Object* scriptArchive);
    void setScriptDeserializedMap(se::Object* deserializedMap);

    inline void setCurrentOwner(se::Object *owner) { _currentPropertyInfo._currentOwner = owner; }
    inline se::Object *getCurrentOwner() { return _currentPropertyInfo._currentOwner; }

    inline const std::vector<cc::IntrusivePtr<AssetDependInfo>>& getDepends() const { return _depends; } // TODO(cjh): Should not handle dependency in Serialization module

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

    inline uint32_t getCurrentOffset() const { return _currentNode->getOffset(); }
    inline void setCurrentOffset(uint32_t offset) { _currentNode->setOffset(offset); }
    
    inline se::Object *_getSharedArrayBufferObject() const { return _sharedMemoryActor.getSharedArrayBufferObject(); } // NOLINT

    se::Value& anyValue(se::Value& value, const char* name);
    se::Value& plainObj(se::Value& value, const char* name);
    se::Value& arrayObj(se::Value& value, const char* name);
    se::Value& serializableObj(se::Value& value, const char* name);
    se::Value& serializableObjArray(se::Value& value, const char* name);

#ifndef SWIGCOCOS
    template <class T>
    void serializePrimitiveData(T& data);
    
    template <class T, uint32_t count>
    void serializePrimitiveDataWithCount(T* data);

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
    void serialize(T& data, const char* name);

    template <class T>
    void serializeObject(T& data);

    template <class T>
    void onSerializingObjectPtr(T& data);

    template <class T>
    void onSerializingObjectRef(T& data);

    template <class T>
    bool onStartSerializeObject(T& data, ccstd::optional<uint32_t>& resetOffset);

    template <class T>
    void onFinishSerializeObject(T& data);
#endif // SWIGCOCOS

private:

    std::string_view popString();

    template <class T>
    T getOrCreateNativeObject(se::Object*& outScriptObject, ccstd::optional<uint32_t>& resetOffset, bool& fromCache);
    void* getOrCreateNativeObjectReturnVoidPtr(se::Object*& outScriptObject, ccstd::optional<uint32_t>& resetOffset, bool& fromCache);

    void doSerializePlainObj(se::Value& value);
    void doSerializeSerializableObj(se::Value& value);
    void doSerializeArray(se::Value& value);
    void doSerializeAny(se::Value& value);

    void serializeScriptObject(se::Object* obj);
    void serializeScriptObjectByNativePtr(const void* nativeObj);

    void onAfterDeserializeScriptObject(se::Object* obj);
    void onAfterDeserializeScriptObjectByNativePtr(const void* nativeObj);
    
    
    inline const char* getCurrentKey() const {
        return _currentPropertyInfo._currentKey;
    }
    
    inline int32_t getCurrentKeyInteger() const {
        return _currentPropertyInfo._currentKeyInteger;
    }
    
    inline void setCurrentKey(const char* key) {
        _currentPropertyInfo._currentKey = key;
        _currentPropertyInfo._currentKeyInteger = -1;
    }
    
    inline void setCurrentKey(int32_t key) {
        _currentPropertyInfo._currentKeyInteger = key;
        _currentPropertyInfo._currentKey = nullptr;
    }

    AssetDependInfo* checkAssetDependInfo();
    static void* seObjGetPrivateData(se::Object* obj);

    TypedArrayTemp<uint8_t> *_bufferView;
    se::Object *_scriptArchive{nullptr};
    ObjectFactory* _objectFactory{nullptr};
    
    struct DeserializedInfo final {
        int32_t offset{0};
        void* nativeObj{nullptr};
        se::Object* scriptObj{nullptr};
    };

    ccstd::unordered_map<int32_t, DeserializedInfo> _deserializedObjIdMap;
    se::Object *_scriptDeserializedMap{nullptr};

    ccstd::vector<cc::IntrusivePtr<AssetDependInfo>> _depends;
    ccstd::vector<std::string_view> _uuidList;
    ccstd::vector<std::string_view> _stringList;

    struct PropertyInfo {
        se::Object* _currentOwner{nullptr};
        const char* _currentKey{nullptr};
        int32_t _currentKeyInteger{-1};
    };
    
    using PropertyStack = std::stack<PropertyInfo>;
    
    class AutoSaveRestorePropertyInfo final {
    public:
        AutoSaveRestorePropertyInfo(BinaryInputArchive* archive): _archive(archive) {
            _archive->_propertyStack.push(_archive->_currentPropertyInfo);
        }
        ~AutoSaveRestorePropertyInfo() {
            _archive->_currentPropertyInfo = _archive->_propertyStack.top();
            _archive->_propertyStack.pop();
        }
    private:
        BinaryInputArchive* _archive;
        CC_DISALLOW_COPY_MOVE_ASSIGN(AutoSaveRestorePropertyInfo)
    };
    
    PropertyStack _propertyStack;
    PropertyInfo _currentPropertyInfo;

    std::unique_ptr<DeserializeNode> _currentNode{nullptr};
    bindings::NativeMemorySharedToScriptActor _sharedMemoryActor;
    
    uint8_t _currentObjectFlags{0};
    bool _isRoot{true};
};

#ifndef SWIGCOCOS

template <class T>
inline void BinaryInputArchive::serializePrimitiveData(T& data) {
    data = _currentNode->popNumber<T>();
}

template <class T, uint32_t count>
inline void BinaryInputArchive::serializePrimitiveDataWithCount(T* data) {
    static constexpr uint32_t TOTAL_BYTES = sizeof(T) * count;
    T* src = _currentNode->popMemory<T, TOTAL_BYTES>();
    memcpy(data, src, TOTAL_BYTES);
}

template <>
inline void BinaryInputArchive::serializeString(ccstd::string& data) {
    data = popString();
}

template <class T>
inline void BinaryInputArchive::serializeStlLikeArray(T& data) {
    using data_type = typename T::value_type;
    int32_t length{0};
    auto tag = _currentNode->popInt8();
    if (tag == SerializeTag::TAG_NULL) {
        data.clear();
        return;
    } else if (tag == SerializeTag::TAG_ARRAY) {
        length = _currentNode->popInt32();
    } else {
        assert(false);
    }
    
    AutoSaveRestorePropertyInfo autoSaveRestore(this);

    setCurrentOwner(nullptr); // Stl container should not be a script owner.

    SerializationTrait<T>::resizeStlLikeArray(data, length);

    for (int32_t i = 0; i < length; ++i) {
        setCurrentKey(i);

        if constexpr (std::is_same_v<bool, data_type>) {
            data_type v{};
            SerializationTrait<data_type>::serialize(v, *this);
            data[i] = v;
        } else {
            SerializationTrait<data_type>::serialize(data[i], *this);
        }
    }
}

template <class T>
void BinaryInputArchive::serializeStlLikeMap(T& data) {
    using key_type = typename T::key_type;
    using mapped_type = typename T::mapped_type;
    auto tag = _currentNode->popInt8();

    if (tag != SerializeTag::TAG_MAP) {
        data.clear();
        return;
    }

    AutoSaveRestorePropertyInfo autoSaveRestore(this);

    setCurrentOwner(nullptr); // Stl container should not be a script owner.

    int32_t elementCount = _currentNode->popInt32();
    SerializationTrait<T>::reserveStlLikeMap(data, elementCount);

    for (int32_t i = 0; i < elementCount; ++i) {
        setCurrentOwner(nullptr); // FIXME(cjh): Should be nullptr for key itself?

        key_type key{};
        SerializationTrait<key_type>::serialize(key, *this);

        if constexpr (std::numeric_limits<key_type>::is_integer) {
            setCurrentKey(static_cast<int32_t>(key));
        } else if constexpr (std::is_same_v<std::decay_t<key_type>, ccstd::string>) {
            setCurrentKey(key.c_str());
        } else {
            static_assert(std::is_same_v<key_type, void>, "Not supported key type");
        }

        mapped_type value{};
        SerializationTrait<mapped_type>::serialize(value, *this);

        data[key] = value;
    }
}

template <class T>
inline void BinaryInputArchive::serializeOptional(ccstd::optional<T>& data) {
    auto tag = _currentNode->popInt8();
    if (tag == SerializeTag::TAG_UNDEFINED) {
        return;
    }

    T serializedData{};
    SerializationTrait<T>::serialize(serializedData, *this);
    data = std::move(serializedData);
}

// TODO(cjh): Move these helper templates to utils
template <typename Tuple, typename Func, size_t... N>
void binary_func_call_tuple(Tuple& t, Func&& func, std::index_sequence<N...>) {
    static_cast<void>(std::initializer_list<int>{(func(std::get<N>(t)), 0)...});
}

template <typename... Args, typename Func>
void binary_travel_tuple(std::tuple<Args...>& t, Func&& func) {
    func_call_tuple(t, std::forward<Func>(func), std::make_index_sequence<sizeof...(Args)>{});
}
//

template <class... Args>
inline void BinaryInputArchive::serializeStdTuple(std::tuple<Args...>& data) {
    static constexpr size_t ARG_N = sizeof...(Args);

    if (_currentNode->popInt8() != SerializeTag::TAG_ARRAY) {
        return;
    }

    AutoSaveRestorePropertyInfo autoSaveRestore(this);

    setCurrentOwner(nullptr);
    setCurrentKey(nullptr);

    int32_t len = _currentNode->popInt32();
    assert(len == ARG_N);

    binary_travel_tuple(data, [&](auto&& item) {
        using data_type = std::decay_t<decltype(item)>;
        SerializationTrait<data_type>::serialize(item, *this);
    });
}

template <class T>
inline void BinaryInputArchive::serialize(T& data, const char* name) {
    AutoSaveRestorePropertyInfo autoSaveRestore(this);
    setCurrentKey(name);
    
    SerializationTrait<T>::serialize(data, *this);
}

template <class T>
inline void BinaryInputArchive::serializeObject(T& data) {
    auto oldObjectFlags = _currentObjectFlags;
    _currentObjectFlags = _currentNode->popUint8();

    if (_currentObjectFlags & OBJECT_KIND_FLAG_NULL) {
        if constexpr (IsPtr<std::decay_t<T>>::value) {
            data = nullptr;
        }
        _currentObjectFlags = oldObjectFlags;
        return;
    }

    ccstd::optional<uint32_t> resetOffset;
    if (onStartSerializeObject(data, resetOffset)) {
        if constexpr (IsPtr<std::decay_t<T>>::value) {
            if (data != nullptr) {
                onSerializingObjectPtr(data);
            }
        } else {
            onSerializingObjectRef(data);
        }
        onFinishSerializeObject(data);
    }

    if (resetOffset.has_value()) {
        _currentNode->setOffset(resetOffset.value());
    }

    _currentObjectFlags = oldObjectFlags;
}

template <class T>
inline void BinaryInputArchive::onSerializingObjectPtr(T& data) {
    using data_type = std::remove_const_t<typename IsPtr<T>::type>;
    // Return directly since the object has already been deserialized.
//cjh    auto iter = _deserializedObjects.find(data);
//    if (iter != _deserializedObjects.cend()) {
//        data = reinterpret_cast<data_type*>(const_cast<void*>(*iter));
//        return;
//    }
//    _deserializedObjects.emplace(data);

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
    if constexpr (has_getScriptObject<data_type, se::Object*()>::value) {
        se::Object* scriptObject = data->getScriptObject();
        serializeScriptObject(scriptObject);
    } else if constexpr (!std::is_same_v<Vec3, data_type>
                         && !std::is_same_v<Vec4, data_type>
                         && !std::is_same_v<Quaternion, data_type>){
        serializeScriptObjectByNativePtr(data);
    }
}

template <class T>
inline void BinaryInputArchive::onSerializingObjectRef(T& data) {
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

    // Serialize JS object
    if constexpr (has_getScriptObject<data_type, se::Object*()>::value) {
        se::Object* scriptObject = data.getScriptObject();
        serializeScriptObject(scriptObject);
    } else if constexpr (!std::is_same_v<Vec3, data_type>
                         && !std::is_same_v<Vec4, data_type>
                         && !std::is_same_v<Quaternion, data_type>){
        serializeScriptObjectByNativePtr(&data);
    }
}

template <class T>
inline bool BinaryInputArchive::onStartSerializeObject(T& data, ccstd::optional<uint32_t>& resetOffset) {
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
                    // uuid has already been set when an asset was deserialized.
                    // So no need to update it here again.
//                    data->setUuid(uuid);

                    if constexpr (has_setScriptObject<value_type, void(se::Object*)>::value) {
                        data->setScriptObject(seDataObj);
                    }
                };
                return false;
            }
        }

        bool fromCache = false;
        value_type* obj = getOrCreateNativeObject<value_type*>(scriptObject, resetOffset, fromCache);
        data = obj;
        setCurrentOwner(scriptObject);

        if (dependInfo != nullptr) {
            dependInfo->owner = scriptObject; // FIXME(cjh): Weak refernce ? Need to root?
        }

        if (!fromCache) {
            if constexpr (has_setScriptObject<value_type, void(se::Object*)>::value) {
                if (data != nullptr) {
                    data->setScriptObject(scriptObject);
                }
            }
        } else {
            return false; // If it's returned from cache, don't need to invoke onSerializingObjectPtr and onFinishSerializeObject
        }
    } else {
        if (_currentObjectFlags & OBJECT_KIND_FLAG_INLINE) {
            _currentNode->popInt32(); // Pop uuidAdvance
            popString(); // Pop type string in data if it's inlined
        }
    }

    return true;
}

template <class T>
inline void BinaryInputArchive::onFinishSerializeObject(T& data) {
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
inline T BinaryInputArchive::getOrCreateNativeObject(se::Object*& outScriptObject, ccstd::optional<uint32_t>& resetOffset, bool& fromCache) {
    //    static_assert(std::is_base_of<CCObject, T>::value, "Native object should be inherited from CCObject");
    return reinterpret_cast<T>(getOrCreateNativeObjectReturnVoidPtr(outScriptObject, resetOffset, fromCache));
}

#endif // SWIGCOCOS

} // namespace cc
