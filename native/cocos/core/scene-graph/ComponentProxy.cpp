/****************************************************************************
 Copyright (c) 2021 Xiamen Yaji Software Co., Ltd.
 
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

#include "ComponentProxy.h"
#include "core/scene-graph/Node.h"
#include "serialization/BinaryInputArchive.h"
#include "serialization/JsonInputArchive.h"

namespace cc {

CC_IMPL_SERIALIZE(ComponentProxy)

template <class Archive>
void ComponentProxy::serialize(Archive &ar) {
    Super::serialize(ar);
    ar.serialize(_node, "node");
    CC_SERIALIZE(_enabled);
    //TODO(cjh): prefab
    uint8_t prefab{0};
    ar.serialize(prefab, "__prefab");
}

bool ComponentProxy::isEnabledInHierarchy() const {
    return _enabled && _node != nullptr && _node->isActiveInHierarchy();
}

}
