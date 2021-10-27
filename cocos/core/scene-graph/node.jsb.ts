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

import * as js from '../utils/js';
import { legacyCC } from '../global-exports';
import { errorID, getError } from '../platform/debug';
import { Component } from '../components/component';
import { NodeEventType } from './node-event';
import { CCObject } from '../data/object';
import { NodeUIProperties } from './node-ui-properties';
import { NodeSpace, TransformBit } from './node-enum';
import {Quat, Vec3} from "../math";

export const Node = jsb.Node;

const NodeCls: any = Node;
/**
 * @en Event types emitted by Node
 * @zh 节点可能发出的事件类型
 */
NodeCls.EventType = NodeEventType;

/**
 * @en Coordinates space
 * @zh 空间变换操作的坐标系
 */
NodeCls.NodeSpace = NodeSpace;

/**
 * @en Bit masks for Node transformation parts
 * @zh 节点变换更新的具体部分
 * @deprecated please use [[Node.TransformBit]]
 */
NodeCls.TransformDirtyBit = TransformBit;

/**
 * @en Bit masks for Node transformation parts, can be used to determine which part changed in [[NodeEventType.TRANSFORM_CHANGED]] event
 * @zh 节点变换更新的具体部分，可用于判断 [[NodeEventType.TRANSFORM_CHANGED]] 事件的具体类型
 */
NodeCls.TransformBit = TransformBit;

const nodeProto: any = jsb.Node.prototype;
export const TRANSFORM_ON = 1 << 0;
const Destroying = CCObject.Flags.Destroying;

function getConstructor<T> (typeOrClassName) {
    if (!typeOrClassName) {
        return null;
    }
    if (typeof typeOrClassName === 'string') {
        return js.getClassByName(typeOrClassName);
    }

    return typeOrClassName;
}

nodeProto._ctor = function (name?: string) {
    this._components = [];
    this._eventProcessor = new legacyCC.NodeEventProcessor(this);
    this._uiProps = new NodeUIProperties(this);

    this._registerListeners();
};

nodeProto.getComponent = function (typeOrClassName) {
    const constructor = getConstructor(typeOrClassName);
    if (constructor) {
        return NodeCls._findComponent(this, constructor);
    }
    return null;
};

nodeProto.getComponents = function (typeOrClassName) {
    const constructor = getConstructor(typeOrClassName);
    const components = [];
    if (constructor) {
        NodeCls._findComponents(this, constructor, components);
    }
    return components;
};

nodeProto.getComponentInChildren = function (typeOrClassName) {
    const constructor = getConstructor(typeOrClassName);
    if (constructor) {
        return NodeCls._findChildComponent(this._children, constructor);
    }
    return null;
};

nodeProto.getComponentsInChildren = function (typeOrClassName) {
    const constructor = getConstructor(typeOrClassName);
    const components = [];
    if (constructor) {
        NodeCls._findComponents(this, constructor, components);
        NodeCls._findChildComponents(this.getChildren(), constructor, components);
    }
    return components;
};

nodeProto.addComponent = function (typeOrClassName) {
    // if (EDITOR && (this._objFlags & Destroying)) {
    //     throw Error('isDestroying');
    // }

    // get component

    let constructor;
    if (typeof typeOrClassName === 'string') {
        constructor = js.getClassByName(typeOrClassName);
        if (!constructor) {
            if (legacyCC._RF.peek()) {
                errorID(3808, typeOrClassName);
            }
            throw TypeError(getError(3807, typeOrClassName));
        }
    } else {
        if (!typeOrClassName) {
            throw TypeError(getError(3804));
        }
        constructor = typeOrClassName;
    }

    // check component

    if (typeof constructor !== 'function') {
        throw TypeError(getError(3809));
    }
    if (!js.isChildClassOf(constructor, Component)) {
        throw TypeError(getError(3810));
    }

    // if (EDITOR && (constructor as typeof constructor & { _disallowMultiple?: unknown })._disallowMultiple) {
    //     this._checkMultipleComp!(constructor);
    // }

    // check requirement

    const ReqComp = (constructor as typeof constructor & { _requireComponent?: typeof Component })._requireComponent;
    if (ReqComp && !this.getComponent(ReqComp)) {
        this.addComponent(ReqComp);
    }

    /// / check conflict
    //
    // if (EDITOR && !_Scene.DetectConflict.beforeAddComponent(this, constructor)) {
    //    return null;
    // }

    //

    const component = new constructor();
    component.node = (this as unknown as Node); // TODO: HACK here
    this._components.push(component);
    // if (EDITOR && EditorExtends.Node && EditorExtends.Component) {
    //     const node = EditorExtends.Node.getNode(this._id);
    //     if (node) {
    //         EditorExtends.Component.add(component._id, component);
    //     }
    // }
    if (this._activeInHierarchy) {
        legacyCC.director._nodeActivator.activateComp(component);
    }

    return component;
};

nodeProto.removeComponent = function (component) {
    if (!component) {
        errorID(3813);
        return;
    }
    let componentInstance: any = null;
    if (component instanceof Component) {
        componentInstance = component;
    } else {
        componentInstance = this.getComponent(component);
    }
    if (componentInstance) {
        componentInstance.destroy();
    }
};

nodeProto.on = function (type, callback, target, useCapture) {
    switch (type) {
    case NodeEventType.TRANSFORM_CHANGED:
        // this._eventMask |= TRANSFORM_ON;
        this.setEventMask(this.getEventMask() | ~TRANSFORM_ON);
        break;
    default:
        break;
    }
    this._eventProcessor.on(type, callback, target, useCapture);
};

nodeProto.off = function (type: string, callback?, target?, useCapture = false) {
    this._eventProcessor.off(type, callback, target, useCapture);

    const hasListeners = this._eventProcessor.hasEventListener(type);
    // All listener removed
    if (!hasListeners) {
        switch (type) {
        case NodeEventType.TRANSFORM_CHANGED:
            // this._eventMask &= ~TRANSFORM_ON;
            this.setEventMask(this.getEventMask() & ~TRANSFORM_ON);
            break;
        default:
            break;
        }
    }
};

nodeProto.once = function (type: string, callback, target?: unknown, useCapture?: any) {
    this._eventProcessor.once(type, callback, target, useCapture);
};

nodeProto.emit = function (type: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any) {
    this._eventProcessor.emit(type, arg0, arg1, arg2, arg3, arg4);
};

nodeProto.dispatchEvent = function (event: Event) {
    this._eventProcessor.dispatchEvent(event);
};

nodeProto.hasEventListener = function (type: string, callback?, target?: unknown) {
    return this._eventProcessor.hasEventListener(type, callback, target);
};

nodeProto.targetOff = function (target: string | unknown) {
    // Check for event mask reset
    const eventMask = this.getEventMask();
    if ((eventMask & TRANSFORM_ON) && !this._eventProcessor.hasEventListener(NodeEventType.TRANSFORM_CHANGED)) {
        // this._eventMask &= ~TRANSFORM_ON;
        this.setEventMask(eventMask & ~TRANSFORM_ON);
    }
};

nodeProto._removeComponent = function (component: Component) {
    if (!component) {
        errorID(3814);
        return;
    }

    if (!(this._objFlags & Destroying)) {
        const i = this._components.indexOf(component);
        if (i !== -1) {
            this._components.splice(i, 1);
            // if (EDITOR && EditorExtends.Component) {
            //     EditorExtends.Component.remove(component._id);
            // }
        } else if (component.node !== this) {
            errorID(3815);
        }
    }
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

// Static functions.

NodeCls._findComponent = function (node, constructor) {
    const cls = constructor as any;
    const comps = node._components;
    if (cls._sealed) {
        for (let i = 0; i < comps.length; ++i) {
            const comp: Component = comps[i];
            if (comp.constructor === constructor) {
                return comp;
            }
        }
    } else {
        for (let i = 0; i < comps.length; ++i) {
            const comp: Component = comps[i];
            if (comp instanceof constructor) {
                return comp;
            }
        }
    }
    return null;
};

NodeCls._findComponents = function (node, constructor, components) {
    const cls = constructor as any;
    const comps = node._components;
    if (cls._sealed) {
        for (let i = 0; i < comps.length; ++i) {
            const comp = comps[i];
            if (comp.constructor === constructor) {
                components.push(comp);
            }
        }
    } else {
        for (let i = 0; i < comps.length; ++i) {
            const comp = comps[i];
            if (comp instanceof constructor) {
                components.push(comp);
            }
        }
    }
};

NodeCls._findChildComponent = function (children, constructor) {
    for (let i = 0; i < children.length; ++i) {
        const node = children[i];
        let comp: Component = NodeCls._findComponent(node, constructor);
        if (comp) {
            return comp;
        }

        const childChildren = node.getChildren();
        if (childChildren.length > 0) {
            comp = NodeCls._findChildComponent(childChildren, constructor);
            if (comp) {
                return comp;
            }
        }
    }
    return null;
};

NodeCls._findChildComponents = function (children, constructor, components) {
    for (let i = 0; i < children.length; ++i) {
        const node = children[i];
        NodeCls._findComponents(node, constructor, components);

        const childChildren = node.getChildren();
        if (childChildren.length > 0) {
            NodeCls._findChildComponents(childChildren, constructor, components);
        }
    }
};

/**
 * @en Determine whether the given object is a normal Node. Will return false if [[Scene]] given.
 * @zh 指定对象是否是普通的节点？如果传入 [[Scene]] 会返回 false。
 */
NodeCls.isNode =  function (obj: unknown): obj is jsb.Node {
    return obj instanceof jsb.Node && (obj.constructor === jsb.Node || !(obj instanceof legacyCC.Scene));
};

const oldGetPosition = nodeProto.getPosition;
const oldGetRotation = nodeProto.getRotation;
const oldGetScale = nodeProto.getScale;

nodeProto.getPosition = function (out?: Vec3) : Vec3 {
    const r = oldGetPosition.call(this);
    if (out) {
        return Vec3.set(out, r.x, r.y, r.z);
    }
    return Vec3.copy(new Vec3(), r);
};

nodeProto.getRotation = function(out?: Quat): Quat {
    const r = oldGetRotation.call(this);
    if (out) {
        return Quat.set(out, r.x, r.y, r.z, r.w);
    }
    return Quat.copy(new Quat(), r);
};

nodeProto.getScale = function (out?: Vec3) : Vec3 {
    const r = oldGetScale.call(this);
    if (out) {
        return Vec3.set(out, r.x, r.y, r.z);
    }
    return Vec3.copy(new Vec3(), r);
};

Object.defineProperty(nodeProto, 'position', {
    configurable: true,
    enumerable: true,
    get () : Vec3 {
        return this.getPosition();
    },
    set (v: Vec3) {
        this.setPosition(v);
    },
});

Object.defineProperty(nodeProto, 'rotation', {
    configurable: true,
    enumerable: true,
    get () : Quat {
        return this.getRotation();
    },
    set (v: Quat) {
        this.setRotation(v);
    },
});

Object.defineProperty(nodeProto, 'scale', {
    configurable: true,
    enumerable: true,
    get () : Vec3 {
        return this.getScale();
    },
    set (v: Vec3) {
        this.setScale(v);
    },
});

export type Node = jsb.Node;

legacyCC.Node = Node;
