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

#include "SerializationData.h"
#include "base/Log.h"

namespace cc {

static constexpr uint32_t DEFAULT_ARRAY_BUFFER_SIZE = 1024;

SerializationData::SerializationData() {
}

SerializationData::~SerializationData() {
    if (_needFreeBuffer) {
        free(_buffer);
    }
}

void SerializationData::init() {
    _bufferCapacity = DEFAULT_ARRAY_BUFFER_SIZE;
    _buffer = reinterpret_cast<uint8_t*>(malloc(_bufferCapacity));
    _dataLength = 0;
    _needFreeBuffer = true;
}

void SerializationData::initWithBuffer(uint8_t* buffer, uint32_t bufferByteLength) {
    _buffer = buffer;
    _bufferCapacity = _dataLength = bufferByteLength;
    _needFreeBuffer = false;
}

void SerializationData::expandBufferIfNeeded(uint32_t byteOffset, uint32_t dataByteLength) {
    if (dataByteLength == 0) {
        return;
    }

    uint32_t newDataSize = byteOffset + dataByteLength;
    if (newDataSize <= byteOffset || newDataSize < dataByteLength) {
        return; // overflow
    }

    if (newDataSize >= _bufferCapacity) {
        uint8_t* oldBuffer = _buffer;
        uint32_t newBufferSize = std::max(newDataSize + DEFAULT_ARRAY_BUFFER_SIZE, _bufferCapacity * 2);
        uint8_t* newBuffer = reinterpret_cast<uint8_t*>(malloc(newBufferSize));
        memcpy(newBuffer, oldBuffer, _bufferCapacity);
        CC_LOG_DEBUG("==> expandBuffer from %u to %u", _bufferCapacity, newBufferSize);
        _bufferCapacity = newBufferSize;
    }
}

void SerializationData::set(uint32_t byteOffset, const std::string_view& value) {
}

std::string_view SerializationData::get(uint32_t byteOffset) {
    return "";
}

} // namespace cc
