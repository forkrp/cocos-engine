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
import { errorID } from '../platform/debug';
import { Component } from '../components/component';
import { NodeEventType } from './node-event';
import { NodeUIProperties } from './node-ui-properties';
import { TransformBit } from './node-enum';
import { Mat4, Quat, Vec3 } from '../math';
import { Layers } from './layers';
import { eventManager } from '../platform/event-manager/event-manager';
import { SerializationContext, SerializationOutput, serializeTag } from '../data';
import { EDITOR } from '../default-constants';
import {
    applyMountedChildren,
    applyMountedComponents, applyPropertyOverrides,
    applyRemovedComponents, applyTargetOverrides,
    createNodeWithPrefab,
    generateTargetMap,
} from '../utils/prefab/utils';

import { syncNodeValues } from "../utils/jsb-utils";
import { initNodeComponentPart } from "./node-jsb-parts/node-comp-part.jsb";
import { initNodeEventPart } from "./node-jsb-parts/node-event-part.jsb";
import { initNodeCommandHandlerPart } from "./node-jsb-parts/node-command-handler-part.jsb";
import { initNodePropertiesPart } from "./node-jsb-parts/node-properties-part.jsb";

// @ts-ignore
export const Node = jsb.Node;
// @ts-ignore
export type Node = jsb.Node;
legacyCC.Node = Node;

export { _tempFloatArray } from './node-jsb-parts/node-command-handler-part.jsb';
export { TRANSFORM_ON } from './node-jsb-parts/node-event-part.jsb';

initNodeComponentPart();
initNodeEventPart();
initNodeCommandHandlerPart();
initNodePropertiesPart();

const clsDecorator = ccclass('cc.Node');

const nodeProto: any = Node.prototype;

Node.isNode = function (obj: any): obj is Node {
    return obj instanceof Node && (obj.constructor === Node || !(obj instanceof legacyCC.Scene));
};

// These functions are invoked by native Node object.
nodeProto._onTransformChanged = function (transformType) {
    this.emit(NodeEventType.TRANSFORM_CHANGED, transformType);
};

nodeProto._onParentChanged = function (oldParent) {
    this.emit(NodeEventType.PARENT_CHANGED, oldParent);
};

nodeProto._onReAttach = function () {
    this._eventProcessor.reattach();
};

nodeProto._onRemovePersistRootNode = function () {
    legacyCC.game.removePersistRootNode(this);
};

nodeProto._onDestroyComponents = function () {
    // Destroy node event processor
    this._eventProcessor.destroy();
    const comps = this._components;
    for (let i = 0; i < comps.length; ++i) {
        // destroy immediate so its _onPreDestroy can be called
        // TO DO
        comps[i]._destroyImmediate();
    }
};

nodeProto._onLayerChanged = function (layer) {
    this.emit(NodeEventType.LAYER_CHANGED, layer);
};

nodeProto._onChildRemoved = function (child) {
    this.emit(NodeEventType.CHILD_REMOVED, child);
};

nodeProto._onChildAdded = function (child) {
    this.emit(NodeEventType.CHILD_ADDED, child);
};

nodeProto._onNodeDestroyed = function () {
    this.emit(NodeEventType.NODE_DESTROYED, this);
};

nodeProto._onSiblingOrderChanged = function () {
    this.emit(NodeEventType.SIBLING_ORDER_CHANGED);
};

nodeProto._onUiTransformDirty = function () {
    this._uiProps.uiTransformDirty = true;
};

nodeProto._onActivateNode = function (shouldActiveNow) {
    legacyCC.director._nodeActivator.activateNode(this, shouldActiveNow);
};

nodeProto._onPostActivated = function (active: boolean) {
    if (active) { // activated
        eventManager.resumeTarget(this);
        // in case transform updated during deactivated period
        this.invalidateChildren(TransformBit.TRS);
    } else { // deactivated
        eventManager.pauseTarget(this);
    }
};

nodeProto._onActiveNode = function (shouldActiveNow: boolean) {
    legacyCC.director._nodeActivator.activateNode(this, shouldActiveNow);
};

nodeProto._onBatchCreated = function (dontSyncChildPrefab: boolean) {
    Node.flushCommandsToNative();
    const prefabInstance = this._prefab?.instance;
    if (!dontSyncChildPrefab && prefabInstance) {
        createNodeWithPrefab(this);
    }

    this.hasChangedFlags = TransformBit.TRS;
    this._dirtyFlags |= TransformBit.TRS;
    this._uiProps.uiTransformDirty = true;
    const children = this._children;
    const len = children.length;
    for (let i = 0; i < len; ++i) {
        children[i]._siblingIndex = i;
        children[i]._onBatchCreated(dontSyncChildPrefab);
    }

    // apply mounted children and property overrides after all the nodes in prefabAsset are instantiated
    if (!dontSyncChildPrefab && prefabInstance) {
        const targetMap: Record<string, any | Node | Component> = {};
        prefabInstance.targetMap = targetMap;
        generateTargetMap(this, targetMap, true);

        applyMountedChildren(this, prefabInstance.mountedChildren, targetMap);
        applyRemovedComponents(this, prefabInstance.removedComponents, targetMap);
        applyMountedComponents(this, prefabInstance.mountedComponents, targetMap);
        applyPropertyOverrides(this, prefabInstance.propertyOverrides, targetMap);
    }

    applyTargetOverrides(this);

    // Sync node _lpos, _lrot, _lscale to native
    syncNodeValues(this);
};

nodeProto._onSceneUpdated = function (scene) {
    this._scene = scene;
};

nodeProto._onLocalPositionUpdated = function (x, y, z) {
    const lpos: Vec3 = this._lpos;
    lpos.x = x;
    lpos.y = y;
    lpos.z = z;
};

nodeProto._onLocalRotationUpdated = function (x, y, z, w) {
    const lrot: Quat = this._lrot;
    lrot.x = x;
    lrot.y = y;
    lrot.z = z;
    lrot.w = w;
};

nodeProto._onLocalScaleUpdated = function (x, y, z) {
    const lscale: Vec3 = this._lscale;
    lscale.x = x;
    lscale.y = y;
    lscale.z = z;
};

nodeProto._onLocalPositionRotationScaleUpdated = function (px, py, pz, rx, ry, rz, rw, sx, sy, sz) {
    const lpos: Vec3 = this._lpos;
    lpos.x = px;
    lpos.y = py;
    lpos.z = pz;

    const lrot: Quat = this._lrot;
    lrot.x = rx;
    lrot.y = ry;
    lrot.z = rz;
    lrot.w = rw;

    const lscale: Vec3 = this._lscale;
    lscale.x = sx;
    lscale.y = sy;
    lscale.z = sz;
};

nodeProto[serializeTag] = function (serializationOutput: SerializationOutput, context: SerializationContext) {
    if (!EDITOR) {
        serializationOutput.writeThis();
    }
};

nodeProto._instantiate = function (cloned: Node, isSyncedNode: boolean) {
    if (!cloned) {
        cloned = legacyCC.instantiate._clone(this, this);
    }

    const newPrefabInfo = cloned._prefab;
    if (EDITOR && newPrefabInfo) {
        if (cloned === newPrefabInfo.root) {
            // newPrefabInfo.fileId = '';
        } else {
            // var PrefabUtils = Editor.require('scene://utils/prefab');
            // PrefabUtils.unlinkPrefab(cloned);
        }
    }
    if (EDITOR && legacyCC.GAME_VIEW) {
        const syncing = newPrefabInfo && cloned === newPrefabInfo.root && newPrefabInfo.sync;
        if (!syncing) {
            cloned._name += ' (Clone)';
        }
    }

    // reset and init
    cloned._parent = null;
    cloned._onBatchCreated(isSyncedNode);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return cloned;
};

// Deserialization
const _class2$u = Node;

// cjh FIXME: replace object.ts with object.jsb.ts
_applyDecoratedDescriptor(_class2$u.prototype, '_name', [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return '';
    },
});

_applyDecoratedDescriptor(_class2$u.prototype, '_objFlags', [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return 0;
    },
});
//

const _descriptor$o = _applyDecoratedDescriptor(_class2$u.prototype, '_parent', [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return null;
    },
});

const _descriptor2$h = _applyDecoratedDescriptor(_class2$u.prototype, '_children', [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return [];
    },
});

const _descriptor3$b = _applyDecoratedDescriptor(_class2$u.prototype, '_active', [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return true;
    },
});

const _descriptor4$9 = _applyDecoratedDescriptor(_class2$u.prototype, '_components', [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return [];
    },
});

const _descriptor5$6 = _applyDecoratedDescriptor(_class2$u.prototype, '_prefab', [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return null;
    },
});

// Node
const _class2$v = Node;
const _descriptor$p = _applyDecoratedDescriptor(_class2$v.prototype, '_lpos', [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return new Vec3();
    },
});

const _descriptor2$i = _applyDecoratedDescriptor(_class2$v.prototype, '_lrot', [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return new Quat();
    },
});

const _descriptor3$c = _applyDecoratedDescriptor(_class2$v.prototype, '_lscale', [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return new Vec3(1, 1, 1);
    },
});

const _descriptor4$a = _applyDecoratedDescriptor(_class2$v.prototype, '_layer', [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return Layers.Enum.DEFAULT;
    },
});

const _descriptor5$7 = _applyDecoratedDescriptor(_class2$v.prototype, '_euler', [serializable], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function initializer () {
        return new Vec3();
    },
});

const _dec2$i = type(Vec3);
_applyDecoratedDescriptor(_class2$v.prototype, 'eulerAngles', [_dec2$i], Object.getOwnPropertyDescriptor(_class2$v.prototype, 'eulerAngles'), _class2$v.prototype);
_applyDecoratedDescriptor(_class2$v.prototype, 'angle', [editable], Object.getOwnPropertyDescriptor(_class2$v.prototype, 'angle'), _class2$v.prototype);
_applyDecoratedDescriptor(_class2$v.prototype, 'layer', [editable], Object.getOwnPropertyDescriptor(_class2$v.prototype, 'layer'), _class2$v.prototype);

//
nodeProto._ctor = function (name?: string) {
    this.__nativeRefs = {};
    this.__jsb_ref_id = undefined;
    this._iN$t = null;
    this.__editorExtras__ = { editorOnly: true };

    this._components = [];
    this._eventProcessor = new legacyCC.NodeEventProcessor(this);
    this._uiProps = new NodeUIProperties(this);
    this._activeInHierarchyArr = new Uint8Array([0]);
    this._layerArr = new Uint32Array([Layers.Enum.DEFAULT]);
    this._worldMatrixArr = new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    this._worldPositionArr = new Float32Array([0, 0, 0]);
    this._worldRotationArr = new Float32Array([0, 0, 0, 0]);
    this._worldScaleArr = new Float32Array([0, 0, 0]);

    this._scene = null;
    this._prefab = null;
    // record scene's id when set this node as persist node
    this._originalSceneId = '';
    this._worldUpdate = 0;

    this._registerListeners();
    // // for deserialization
    // // eslint-disable-next-line @typescript-eslint/no-this-alias
    // const _this = this;
    // // baseNode properties
    // _initializerDefineProperty(_this, "_parent", _descriptor$o, _assertThisInitialized(_this));
    // _initializerDefineProperty(_this, "_children", _descriptor2$h, _assertThisInitialized(_this));
    // _initializerDefineProperty(_this, "_active", _descriptor3$b, _assertThisInitialized(_this));
    // _initializerDefineProperty(_this, "_components", _descriptor4$9, _assertThisInitialized(_this));
    // _initializerDefineProperty(_this, "_prefab", _descriptor5$6, _assertThisInitialized(_this));
    // // Node properties
    // _initializerDefineProperty(_this, "_lpos", _descriptor$p, _assertThisInitialized(_this));
    // _initializerDefineProperty(_this, "_lrot", _descriptor2$i, _assertThisInitialized(_this));
    // _initializerDefineProperty(_this, "_lscale", _descriptor3$c, _assertThisInitialized(_this));
    // _initializerDefineProperty(_this, "_layer", _descriptor4$a, _assertThisInitialized(_this));
    // _initializerDefineProperty(_this, "_euler", _descriptor5$7, _assertThisInitialized(_this));
    //

    this._children = [];
    this._parentInternal = null;

    this._lpos = new Vec3();
    this._lrot = new Quat();
    this._lscale = new Vec3(1, 1, 1);
    this._euler = new Vec3();

    const lpos: any = this._lpos;
    lpos.x = lpos.y = lpos.z = null;
    const lrot: any = this._lrot;
    lrot.x = lrot.y = lrot.z = lrot.w = null;
    const lscale: any = this._lscale;
    lscale.x = lscale.y = lscale.z = null;
    const euler: any = this._euler;
    euler.x = euler.y = euler.z = null;

    //inner use properties
    this._positionCache = new Vec3();
    this._rotationCache = new Quat();
    this._scaleCache = new Vec3();

    this._worldPositionCache = new Vec3();
    this._worldRotationCache = new Quat();
    this._worldScaleCache = new Vec3();
    this._worldMatrixCache = new Mat4();
    this._eulerAnglesCache = new Vec3();
    this._forwardCache = new Vec3();
    this._upCache = new Vec3();
    this._rightCache = new Vec3();
    this._worldRTCache = new Mat4();
    this._worldRSCache = new Mat4();
    this._inverseTransformPointCache = new Vec3();
    this._needUpdatelocalPRS = false;
    this._eventMaskInternal = 0;
    //

    this._registeredNodeEventTypeMask = 0;

    this.on(NodeEventType.CHILD_ADDED, (child)=>{
        this._children.push(child);
        child._parentInternal = this;
    });

    this.on(NodeEventType.CHILD_REMOVED, (child)=>{
        const removeAt = this._children.indexOf(child);
        if (removeAt < 0) {
            errorID(1633);
            return;
        }
        this._children.splice(removeAt, 1);
        child._parentInternal = null;
    });

    this._onSiblingIndexChanged = function (index) {
        const siblings = this._parent._children;
        index = index !== -1 ? index : siblings.length - 1;
        const oldIndex = siblings.indexOf(this);
        if (index !== oldIndex) {
            siblings.splice(oldIndex, 1);
            if (index < siblings.length) {
                siblings.splice(index, 0, this);
            } else {
                siblings.push(this);
            }
        }
    }
};
//
clsDecorator(Node);
