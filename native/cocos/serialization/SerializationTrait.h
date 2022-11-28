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

#include <stdint.h>
#include <memory>

#include "base/Ptr.h"
#include "base/std/container/list.h"
#include "base/std/container/string.h"
#include "base/std/container/unordered_map.h"
#include "base/std/container/vector.h"

namespace cc {

template <class T>
struct IsIntrusivePtr : std::false_type {
    using type = T;
};

template <class T>
struct IsIntrusivePtr<IntrusivePtr<T>> : std::true_type {
    using type = T;
};

template <class T>
struct IsPtr : std::false_type {};

template <class T>
struct IsPtr<T*> : std::true_type {
    using type = T;
};

template <class T>
struct IsPtr<T* const> : std::true_type {
    using type = T;
};

template <class T>
struct IsPtr<T* volatile> : std::true_type {
    using type = T;
};

template <class T>
struct IsPtr<T* const volatile> : std::true_type {
    using type = T;
};

template <class T>
struct IsPtr<IntrusivePtr<T>> : std::true_type {
    using type = T;
};

template <class T>
struct IsPtr<std::shared_ptr<T>> : std::true_type {
    using type = T;
};

template <class T>
class SerializationTraitBase {
public:
    using data_type = T;
};

template <class T>
class SerializationTraitPrimitive : public SerializationTraitBase<T> {
public:
    using data_type = T;

    template <class Archive>
    inline static void serialize(data_type& data, Archive& ar) {
        ar.serializePrimitiveData(data);
    }
};

template <class T>
class SerializationTrait : public SerializationTraitBase<T> {
public:
    using data_type = T;

    template <class Archive>
    inline static void serialize(data_type& data, Archive& ar) {
        if constexpr (std::is_class_v<std::remove_cv_t<std::remove_pointer_t<data_type>>>) {
            if (ar.onStartSerializeObject(data)) {
                if constexpr (IsPtr<data_type>::value) {
                    if (data != nullptr) {
                        ar.onSerializingObjectPtr(data);
                    }
                } else {
                    ar.onSerializingObjectRef(data);
                }
                ar.onFinishSerializeObject(data);
            }
        } else if constexpr (std::is_enum_v<data_type>) {
            using underlying_type = std::underlying_type_t<data_type>;
            underlying_type v{};
            SerializationTrait<underlying_type>::serialize(v, ar);
            data = static_cast<data_type>(v);
        } else {
            static_assert(std::is_void_v<T>, "T needs to be specialized");
        }
    }
};

template <>
class SerializationTrait<bool> : public SerializationTraitPrimitive<bool> {};

template <>
class SerializationTrait<int8_t> : public SerializationTraitPrimitive<int8_t> {};

template <>
class SerializationTrait<int16_t> : public SerializationTraitPrimitive<int16_t> {};

template <>
class SerializationTrait<int32_t> : public SerializationTraitPrimitive<int32_t> {};

template <>
class SerializationTrait<int64_t> : public SerializationTraitPrimitive<int64_t> {};

template <>
class SerializationTrait<uint8_t> : public SerializationTraitPrimitive<uint8_t> {};

template <>
class SerializationTrait<uint16_t> : public SerializationTraitPrimitive<uint16_t> {};

template <>
class SerializationTrait<uint32_t> : public SerializationTraitPrimitive<uint32_t> {};

template <>
class SerializationTrait<uint64_t> : public SerializationTraitPrimitive<uint64_t> {};

template <>
class SerializationTrait<float> : public SerializationTraitPrimitive<float> {};

template <>
class SerializationTrait<double> : public SerializationTraitPrimitive<double> {};

template <class StringT>
class SerializationTraitStringBase : public SerializationTraitBase<StringT> {
public:
    using data_type = StringT;

    template <class Archive>
    inline static void serialize(data_type& data, Archive& ar) {
        ar.serializeString(data);
    }
};

template <>
class SerializationTrait<ccstd::string> : public SerializationTraitStringBase<ccstd::string> {};

template <class T, class Allocator>
class SerializationTrait<ccstd::vector<T, Allocator>> : public SerializationTraitBase<ccstd::vector<T, Allocator>> {
public:
    using data_type = ccstd::vector<T, Allocator>;

    template <class Archive>
    inline static void serialize(data_type& data, Archive& ar) {
        ar.serializeStlLikeArray(data);
    }

    static void resizeStlLikeArray(data_type& data, size_t size) {
        data.resize(size);
    }
};

template <class K, class V, class Allocator>
class SerializationTrait<ccstd::unordered_map<K, V, Allocator>> : public SerializationTraitBase<ccstd::unordered_map<K, V, Allocator>> {
public:
    using data_type = ccstd::unordered_map<K, V, Allocator>;

    template <class Archive>
    inline static void serialize(data_type& data, Archive& ar) {
        ar.serializeStlLikeMap(data);
    }

    static void reserveStlLikeMap(data_type& data, size_t capacity) {
        data.reserve(capacity);
    }
};

} // namespace cc
