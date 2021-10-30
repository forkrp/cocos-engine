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
import { ccclass, type } from 'cc.decorator';
import {
    _applyDecoratedDescriptor,
    _assertThisInitialized,
    _initializerDefineProperty,
} from '../data/utils/decorator-jsb-utils';
import { legacyCC } from '../global-exports';
import { ImageAsset } from './image-asset';

const texture2DProto: any = jsb.Texture2D.prototype;

texture2DProto.createNode = null!;

export type Texture2D = jsb.Texture2D;
export const Texture2D = jsb.Texture2D;

const clsDecorator = ccclass('cc.Texture2D');

const _class2$c = Texture2D;
const _dec2$6 = type([ImageAsset]); // xwx: jsb.ImageAsset?

const _descriptor$a = _applyDecoratedDescriptor(_class2$c.prototype, '_mipmaps', [_dec2$6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return [];
    },
});

texture2DProto._ctor = function () {
    // for deserialization
    // _initializerDefineProperty(_this, 'isRGBE', _descriptor$b, _assertThisInitialized(_this));
    // _initializerDefineProperty(_this, '_mipmaps', _descriptor2$7, _assertThisInitialized(_this));
};

clsDecorator(Texture2D);

legacyCC.Texture2D = jsb.Texture2D;
