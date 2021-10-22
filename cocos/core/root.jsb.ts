import {Pool} from "./memop";
import {warnID} from "./platform";
import { Batcher2D } from '../2d/renderer/batcher-2d';
import legacyCC from '../../predefine';

declare const jsb: any;

export const Root = jsb.Root;

enum LightType {
    DIRECTIONAL,
    SPHERE,
    SPOT,
    UNKNOWN,
}

/**
 * @zh
 * Root描述信息
 */
export interface IRootInfo {
    enableHDR?: boolean;
}

Root.prototype._ctor = function() {
    this._modelPools = new Map();
    this._lightPools = new Map();
    this._batcher = null;
    this._registerListeners();
};

Root.prototype.initialize = function (info: IRootInfo) {
    //TODO:
    this._initialize(info);
    return Promise.resolve();
}

Root.prototype.createModel = function (ModelCtor) {
    let p = this._modelPools.get(ModelCtor);
    if (!p) {
        this._modelPools.set(ModelCtor, new Pool(() => new ModelCtor(), 10));
        p = this._modelPools.get(ModelCtor)!;
    }
    const model = p.alloc();
    model.initialize();
    return model;
}

Root.prototype.removeModel = function (m) {
    const p = this._modelPools.get(m.constructor);
    if (p) {
        p.free(m);
        m.destroy();
        if (m.scene) {
            m.scene.removeModel(m);
        }
    } else {
        warnID(1300, m.constructor.name);
    }
};

Root.prototype.createLight = function (LightCtor) {
    let l = this._lightPools.get(LightCtor);
    if (!l) {
        this._lightPools.set(LightCtor, new Pool(() => new LightCtor(), 4));
        l = this._lightPools.get(LightCtor)!;
    }
    const light = l.alloc();
    light.initialize();
    return light;
};

Root.prototype.destroyLight = function(l) {
    const p = this._lightPools.get(l.constructor);
    l.destroy();
    if (p) {
        p.free(l);
        if (l.scene) {
            switch (l.type) {
                case LightType.SPHERE:
                    l.scene.removeSphereLight(l);
                    break;
                case LightType.SPOT:
                    l.scene.removeSpotLight(l);
                    break;
                default:
                    break;
            }
        }
    }
}

Root.prototype._onBatch2DInit = function() {
    if (!this._batcher && legacyCC.internal.Batcher2D) {
        this._batcher = new legacyCC.internal.Batcher2D(this) as Batcher2D;
        if (!this._batcher.initialize()) {
            this.destroy();
            return false;
        }
    }
};

Root.prototype._onBatch2DUpdate = function() {
    for (let i = 0; i < this._scenes.length; ++i) {
        this._scenes[i].removeBatches();
    }
    if (this._batcher) this._batcher.update();
};

Root.prototype._onBatch2DUploadBuffers = function () {
    if (this._batcher) this._batcher.uploadBuffers();
};

Root.prototype._onBatch2DReset = function () {
    if (this._batcher) this._batcher.reset();
};
