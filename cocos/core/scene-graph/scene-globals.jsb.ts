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

import { ccclass, editable, serializable, type } from 'cc.decorator';
import {
    _applyDecoratedDescriptor,
    _assertThisInitialized,
    _initializerDefineProperty,
} from '../data/utils/decorator-jsb-utils';
import { legacyCC } from '../global-exports';
import { Color } from "../math";
import { CCFloat } from "../data";
import {TextureCube} from "../assets";

/**
 * @en Environment lighting information in the Scene
 * @zh 场景的环境光照相关信息
 */
export const AmbientInfo = jsb.AmbientInfo;
legacyCC.AmbientInfo = AmbientInfo;
const ambientInfoProto: any = AmbientInfo.prototype;
const ambientInfoDecorator = ccclass('cc.AmbientInfo');
const _class2$w = AmbientInfo;
const _descriptor$q = _applyDecoratedDescriptor(_class2$w.prototype, "_skyColor", [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer() {
        return new Color(51, 128, 204, 1.0);
    }
});

const _descriptor2$j = _applyDecoratedDescriptor(_class2$w.prototype, "_skyIllum", [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer() {
        return 20000.0; // cjh FIXME: Ambient.SKY_ILLUM;
    }
});

const _descriptor3$d = _applyDecoratedDescriptor(_class2$w.prototype, "_groundAlbedo", [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer() {
        return new Color(51, 51, 51, 255);
    }
});

const _dec2$j = type(CCFloat);

_applyDecoratedDescriptor(_class2$w.prototype, "skyColor", [editable], Object.getOwnPropertyDescriptor(_class2$w.prototype, "skyColor"), _class2$w.prototype);
_applyDecoratedDescriptor(_class2$w.prototype, "skyIllum", [editable, _dec2$j], Object.getOwnPropertyDescriptor(_class2$w.prototype, "skyIllum"), _class2$w.prototype);
_applyDecoratedDescriptor(_class2$w.prototype, "groundAlbedo", [editable], Object.getOwnPropertyDescriptor(_class2$w.prototype, "groundAlbedo"), _class2$w.prototype);

ambientInfoProto._ctor = function () {
    _initializerDefineProperty(this, "_skyColor", _descriptor$q, this);
    _initializerDefineProperty(this, "_skyIllum", _descriptor2$j, this);
    _initializerDefineProperty(this, "_groundAlbedo", _descriptor3$d, this);
};

ambientInfoDecorator(AmbientInfo);

/**
 * @en Skybox related information
 * @zh 天空盒相关信息
 */
export const SkyboxInfo = jsb.SkyboxInfo;
legacyCC.SkyboxInfo = SkyboxInfo;
const skyboxInfoProto: any = SkyboxInfo.prototype;
const skyboxInfoDecorator = ccclass('cc.SkyboxInfo');
const _dec4$9 = type(TextureCube);
const _dec5$6 = type(TextureCube);
const _class5$3 = SkyboxInfo;
const _descriptor4$b = _applyDecoratedDescriptor(_class5$3.prototype, "_envmap", [_dec4$9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer() {
        return null;
    }
});

const _descriptor5$8 = _applyDecoratedDescriptor(_class5$3.prototype, "_isRGBE", [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer() {
        return false;
    }
});

const _descriptor6$3 = _applyDecoratedDescriptor(_class5$3.prototype, "_enabled", [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer() {
        return false;
    }
});

const _descriptor7$3 = _applyDecoratedDescriptor(_class5$3.prototype, "_useIBL", [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer() {
        return false;
    }
});

_applyDecoratedDescriptor(_class5$3.prototype, "enabled", [editable], Object.getOwnPropertyDescriptor(_class5$3.prototype, "enabled"), _class5$3.prototype);
_applyDecoratedDescriptor(_class5$3.prototype, "useIBL", [editable], Object.getOwnPropertyDescriptor(_class5$3.prototype, "useIBL"), _class5$3.prototype);
_applyDecoratedDescriptor(_class5$3.prototype, "envmap", [editable, _dec5$6], Object.getOwnPropertyDescriptor(_class5$3.prototype, "envmap"), _class5$3.prototype);
_applyDecoratedDescriptor(_class5$3.prototype, "isRGBE", [editable], Object.getOwnPropertyDescriptor(_class5$3.prototype, "isRGBE"), _class5$3.prototype);

skyboxInfoProto._ctor = function () {
    // _initializerDefineProperty(this, "_envmap", _descriptor4$b, this);
    // _initializerDefineProperty(this, "_isRGBE", _descriptor5$8, this);
    // _initializerDefineProperty(this, "_enabled", _descriptor6$3, this);
    // _initializerDefineProperty(this, "_useIBL", _descriptor7$3, this);
};

skyboxInfoDecorator(SkyboxInfo);

/**
 * @zh 全局雾相关信息
 * @en Global fog info
 */
export const FogInfo = jsb.FogInfo;
legacyCC.FogInfo = FogInfo;
const fogInfoProto: any = FogInfo.prototype;
const fogInfoDecorator = ccclass('cc.FogInfo');

fogInfoDecorator(FogInfo);

/**
 * @en Scene level planar shadow related information
 * @zh 平面阴影相关信息
 */
export const ShadowsInfo = jsb.ShadowsInfo;
legacyCC.ShadowsInfo = ShadowsInfo;
// setClassName('cc.ShadowsInfo', ShadowsInfo);

/**
 * @en All scene related global parameters, it affects all content in the corresponding scene
 * @zh 各类场景级别的渲染参数，将影响全场景的所有物体
 */
export const SceneGlobals = jsb.SceneGlobals;
legacyCC.SceneGlobals = SceneGlobals;
// setClassName('cc.SceneGlobals', SceneGlobals);
