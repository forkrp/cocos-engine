/*
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
*/

import { ccclass, editable, serializable } from 'cc.decorator';
import {
    _applyDecoratedDescriptor,
    _assertThisInitialized,
    _initializerDefineProperty,
} from '../data/utils/decorator-jsb-utils';
import { legacyCC } from '../global-exports';
import { SceneGlobals } from './scene-globals';
import { Node } from './node';

export const Scene = jsb.Scene;
export type Scene = jsb.Scene;

const clsDecorator = ccclass('cc.Scene');

const sceneProto: any = Scene.prototype;
const _class2$x = Scene;

_applyDecoratedDescriptor(_class2$x.prototype, 'globals', [editable], Object.getOwnPropertyDescriptor(_class2$x.prototype, 'globals'), _class2$x.prototype);
const _descriptor$r = _applyDecoratedDescriptor(_class2$x.prototype, 'autoReleaseAssets', [serializable, editable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return false;
    },
});

const _descriptor2$k = _applyDecoratedDescriptor(_class2$x.prototype, '_globals', [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return new SceneGlobals();
    },
});

sceneProto._ctor = function () {
    Node.prototype._ctor.apply(this, arguments);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    // const _this = this;
    // _initializerDefineProperty(_this, "autoReleaseAssets", _descriptor$r, _assertThisInitialized(_this));
    // _initializerDefineProperty(_this, "_globals", _descriptor2$k, _assertThisInitialized(_this));
};

function updateChildren (node: Node) {
    node._setChildren(node._children);
    for (let i = 0, len = node._children.length; i < len; ++i) {
        const child = node._children[i];
        jsb.registerNativeRef(node, child);
        updateChildren(child);
    }
    Object.defineProperty(node, '_children', {
        enumerable: true,
        configurable: true,
        get () {
            return node.getChildren();
        },
    });
}

const oldLoad = sceneProto._load;
sceneProto._load = function () {
    updateChildren(this);
    oldLoad.call(this);
};

const oldActivate = sceneProto._activate;
sceneProto._activate = function (active: boolean) {
    active = (active !== false);
    // if (EDITOR) {
    //     // register all nodes to editor
    //     this._registerIfAttached!(active);
    // }
    legacyCC.director._nodeActivator.activateNode(this, active);
    // The test environment does not currently support the renderer
    // if (!TEST) {
    this._globals.activate();
    // }
};

clsDecorator(Scene);
legacyCC.Scene = Scene;
