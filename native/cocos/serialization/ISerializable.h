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

#include <functional>

#define CC_DECLARE_SERIALIZABLE() \
    void virtualSerialize(JsonInputArchive& ar) override; \
    void virtualSerialize(BinaryInputArchive& ar) override;

#define CC_IMPL_SERIALIZABLE(__type__) \
    void __type__::virtualSerialize(JsonInputArchive& ar) { \
        __type__::serialize(ar); \
    } \
    void __type__::virtualSerialize(BinaryInputArchive& ar)  { \
        __type__::serialize(ar); \
    }


namespace cc {

class JsonInputArchive;
class BinaryInputArchive;
class RefCounted;

class ISerializable {
public:
    virtual void virtualSerialize(JsonInputArchive& ar) {}
    virtual void virtualSerialize(BinaryInputArchive& ar) {}

    virtual void onBeforeSerialize() {}
    virtual void onAfterDeserialize() {}

    virtual RefCounted* getRefCounted() { return nullptr; }
};

using ObjectFactory = std::function<ISerializable*(const char*)>;

}
