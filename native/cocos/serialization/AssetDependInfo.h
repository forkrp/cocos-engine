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

#include "base/RefCounted.h"
#include "base/std/container/string.h"
#include "base/std/variant.h"

#include <functional>
#include <string_view>

namespace se {
class Object;
}

namespace cc {

using AssetDereferenceCallback = std::function<void(se::Object*)>;

struct AssetDependInfo final : public RefCounted {
    AssetDereferenceCallback dereferenceCb{nullptr};
    se::Object* owner{nullptr};
    
    uint32_t uuidIndex{0};
    ccstd::string expectedType; //TODO(cjh): Whether need this?

    void dereference(se::Object* obj);
    inline void setUuid(const ccstd::string & uuid) { _uuid = uuid; }
    inline const ccstd::string &getUuid() const { return _uuid; }
    
    using PropNameType = ccstd::variant<ccstd::string, int32_t>;
    inline const PropNameType& getPropName() const { return _propName; }
    inline void setPropName(PropNameType&& propName) { _propName = std::move(propName); }

private:
    ccstd::variant<ccstd::string, int32_t> _propName;
    ccstd::string _uuid;
};

} // namespace cc
