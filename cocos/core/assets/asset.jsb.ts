/*
 Copyright (c) 2021 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

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

import { legacyCC } from '../global-exports';
import { CallbacksInvoker } from '../event/callbacks-invoker';
import { applyMixins } from '../event/event-target-factory';
import { createMap } from "../utils/js-typed";

/**
 * @param error - null or the error info
 * @param node - the created node or null
 */
export type CreateNodeCallback = (error: Error | null, node: Node) => void;

applyMixins(jsb.Asset, [CallbacksInvoker]);

const assetProto: any = jsb.Asset.prototype;

assetProto._ctor = function() {
    this._callbackTable = createMap(true);
};

assetProto.createNode = null!;

export type Asset = jsb.Asset;
export const Asset = jsb.Asset;
legacyCC.Asset = jsb.Asset;
