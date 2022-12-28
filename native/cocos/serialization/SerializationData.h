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

#include <assert.h>
#include <stdint.h>

#include <type_traits>

#include "base/std/container/string.h"

namespace cc {

class SerializationData final {
public:
    SerializationData();
    ~SerializationData();

    void init();
    void initWithBuffer(uint8_t* buffer, uint32_t bufferByteLength);

    inline uint8_t* getBuffer() const { return _buffer; }
    inline uint32_t getByteLength() const { return _dataLength; }

    void expandBufferIfNeeded(uint32_t byteOffset, uint32_t dataByteLength);

    template <typename T, typename = std::enable_if_t<std::is_arithmetic<T>::value> >
    inline void set(uint32_t byteOffset, T value) {
        if (byteOffset < 0) {
            return;
        }
        expandBufferIfNeeded(byteOffset, sizeof(T));
        *reinterpret_cast<T*>(&_buffer[byteOffset]) = value;
        _dataLength = std::max(byteOffset + (uint32_t)sizeof(T), _dataLength);
    }

    void setString(uint32_t byteOffset, const std::string_view& value);

    template <typename T, typename = std::enable_if_t<std::is_arithmetic<T>::value> >
    inline T get(uint32_t byteOffset) const {
        if (byteOffset >= 0 && byteOffset + sizeof(T) <= _dataLength) {
            return *reinterpret_cast<T*>(&_buffer[byteOffset]);
        }
        assert(false);
        return {};
    }

    std::string_view getString(uint32_t byteOffset, uint32_t strLength);

private:
    uint8_t* _buffer{nullptr};
    uint32_t _bufferCapacity{0};
    uint32_t _dataLength{0};
    bool _needFreeBuffer{false};
};

} // namespace cc
