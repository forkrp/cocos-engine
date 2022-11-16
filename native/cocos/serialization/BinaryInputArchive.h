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
#include "SerializationTrait.h"

namespace cc {

class DeserializeNode final {
public:
};

class BinaryInputArchive final : public IArchive {
public:
    BinaryInputArchive();
    ~BinaryInputArchive();

    bool isReading() const { return true; }
    bool isWritting() const { return false; }
    bool isExporting() const { return false; }

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

    template <class T>
    void serializePrimitiveData(T&);

    template <class T>
    void serializeString(T& data);

    template <class T>
    void serializeStlLikeMap(T&) {}

    template <class T>
    void serialize(T& data, const char* name);

    template <class T>
    void onStartSerialize(T& data);

    template <class T>
    void onFinishSerialize(T& data);
};

template <class T>
void BinaryInputArchive::serializePrimitiveData(T&) {
}

template <class T>
void BinaryInputArchive::serializeString(T&) {
}

template <class T>
void BinaryInputArchive::serialize(T& data, const char* name) {
    SerializationTrait<T>::serialize(data, *this);
}

template <class T>
void BinaryInputArchive::onStartSerialize(T& data) {}

template <class T>
void BinaryInputArchive::onFinishSerialize(T& data) {}

} // namespace cc
