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

#define CC_DECLARE_SERIALIZABLE()                                              \
public:                                                                        \
    template <class Archive>                                                   \
    void serialize(Archive& ar);                                               \
    void virtualSerialize(cc::JsonInputArchive& ar) override;                  \
    void virtualSerialize(cc::BinaryInputArchive& ar) override;                \
    void virtualOnBeforeSerialize() override;                                  \
    void virtualOnAfterDeserialize() override;                                 \
                                                                               \
private:                                                                       \
    inline void serializeInternal(cc::JsonInputArchive& ar) { serialize(ar); } \
    inline void serializeInternal(cc::BinaryInputArchive& ar) { serialize(ar); }

#define CC_IMPL_SERIALIZABLE(__klass__)                                                    \
    void __klass__::virtualSerialize(JsonInputArchive& ar) { __klass__::serialize(ar); }   \
    void __klass__::virtualSerialize(BinaryInputArchive& ar) { __klass__::serialize(ar); } \
    void __klass__::virtualOnBeforeSerialize() { __klass__::onBeforeSerialize(); }         \
    void __klass__::virtualOnAfterDeserialize() { __klass__::onAfterDeserialize(); }

namespace se {
class Object;
}

namespace cc {

class JsonInputArchive;
class BinaryInputArchive;
class RefCounted;

class ISerializable {
public:
    virtual ~ISerializable() = default;
    virtual void virtualSerialize(JsonInputArchive& ar) {}
    virtual void virtualSerialize(BinaryInputArchive& ar) {}

    virtual void virtualOnBeforeSerialize() {}
    virtual void virtualOnAfterDeserialize() {}

    void onBeforeSerialize() {}
    void onAfterDeserialize() {}
};

class ObjectFactory {
public:
    virtual ~ObjectFactory() = default;

    virtual bool needCreateScriptObject(const char* type) = 0;
    virtual void* createNativeObject(const char* type) = 0;
    virtual se::Object* createScriptObject(const char* type) = 0;
};

} // namespace cc
