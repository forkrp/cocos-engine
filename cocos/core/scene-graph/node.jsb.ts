declare const jsb: any;

import * as js from '../utils/js';
import { legacyCC } from '../global-exports';
import { errorID, getError } from '../platform/debug';
import { Component } from '../components/component';
import { NodeEventType } from './node-event';
import { CCObject } from '../data/object';
import { NodeUIProperties } from './node-ui-properties';

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


jsb.Node.prototype._ctor = function (name?: string) {
    this._components = [];
    this._eventProcessor = new legacyCC.NodeEventProcessor(this);
    this._uiProps = new NodeUIProperties(this);

    this._registerListeners();
}

Object.defineProperties(jsb.Node.prototype, {
    '_components': {
        get: function () {
            return this._components;
        }
    },
    '_eventProcessor': {
        get: function () {
            return this._eventProcessor;
        }
    }
});

jsb.Node.prototype.getComponent = function (typeOrClassName) {
    const constructor = getConstructor(typeOrClassName);
    if (constructor) {
        return jsb.Node._findComponent(this, constructor);
    }
    return null;
}

jsb.Node.prototype.getComponents = function (typeOrClassName) {
    const constructor = getConstructor(typeOrClassName);
    const components = [];
    if (constructor) {
        jsb.Node._findComponents(this, constructor, components);
    }
    return components;
}

jsb.Node.prototype.getComponentInChildren = function (typeOrClassName) {
    const constructor = getConstructor(typeOrClassName);
    if (constructor) {
        return jsb.Node._findChildComponent(this._children, constructor);
    }
    return null;
}

jsb.Node.prototype.getComponentsInChildren = function (typeOrClassName) {
    const constructor = getConstructor(typeOrClassName);
    const components = [];
    if (constructor) {
        jsb.Node._findComponents(this, constructor, components);
        jsb.Node._findChildComponents(this.getChildren(), constructor, components);
    }
    return components;
}

jsb.Node.prototype.addComponent = function (typeOrClassName) {
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
}

jsb.Node.prototype.removeComponent = function (component) {
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
}

jsb.Node.prototype.on = function (type, callback, target, useCapture) {
    switch (type) {
    case NodeEventType.TRANSFORM_CHANGED:
        // this._eventMask |= TRANSFORM_ON;
        this.setEventMask(this.getEventMask() | ~TRANSFORM_ON);
        break;
    default:
        break;
    }
    this._eventProcessor.on(type, callback, target, useCapture);
}

jsb.Node.prototype.off = function (type: string, callback?, target?, useCapture = false) {
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
}

jsb.Node.prototype.once = function (type: string, callback, target?: unknown, useCapture?: any) {
    this._eventProcessor.once(type, callback, target, useCapture);
}

jsb.Node.prototype.emit = function (type: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any) {
    this._eventProcessor.emit(type, arg0, arg1, arg2, arg3, arg4);
}

jsb.Node.prototype.dispatchEvent = function (event: Event) {
    this._eventProcessor.dispatchEvent(event);
}

jsb.Node.prototype.hasEventListener = function (type: string, callback?, target?: unknown) {
    return this._eventProcessor.hasEventListener(type, callback, target);
}

jsb.Node.prototype.targetOff = function (target: string | unknown) {
    // Check for event mask reset
    let eventMask = this.getEventMask();
    if ((eventMask & TRANSFORM_ON) && !this._eventProcessor.hasEventListener(NodeEventType.TRANSFORM_CHANGED)) {
        // this._eventMask &= ~TRANSFORM_ON;
        this.setEventMask(eventMask & ~TRANSFORM_ON);
    }
}

jsb.Node.prototype._removeComponent = function (component: Component) {
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
}

// These functions are invoked by native Node object.

jsb.Node.prototype._onTransformChanged = function (transformType) {
    this._eventProcessor.dispatchEvent(NodeEventType.TRANSFORM_CHANGED, transformType);
}

jsb.Node.prototype._onParentChanged = function (oldParent) {
    this._eventProcessor(NodeEventType.PARENT_CHANGED, oldParent);
}

jsb.Node.prototype._onReattach = function () {
    this._eventProcessor.reattach();
}

jsb.Node.prototype._onRemovePersistRootNode = function () {
    legacyCC.game.removePersistRootNode(this);
}

jsb.Node.prototype._onDestroyComponents = function () {
    const comps = this._components;
    for (let i = 0; i < comps.length; ++i) {
        // destroy immediate so its _onPreDestroy can be called
        // TO DO
        comps[i]._destroyImmediate();
    }
}

jsb.Node.prototype._onLayerChanged = function (layer) {
    this.emit(NodeEventType.LAYER_CHANGED, layer);
}

jsb.Node.prototype._onChildRemoved = function (child) {
    this.emit(NodeEventType.CHILD_REMOVED, child);
}

jsb.Node.prototype._onChildAdded = function (child) {
    this.emit(NodeEventType.CHILD_ADDED, child);
}

jsb.Node.prototype._onNodeDestroyed = function () {
    this.emit(NodeEventType.NODE_DESTROYED, this);
}

jsb.Node.prototype._onSiblingOrderChanged = function () {
    this.emit(NodeEventType.SIBLING_ORDER_CHANGED);
}

jsb.Node.prototype._onUiTransformDirty = function () {
    this._uiProps.uiTransformDirty = true;
}

jsb.Node.prototype._onActivateNode = function (shouldActiveNow) {
    legacyCC.director._nodeActivator.activateNode(this, shouldActiveNow);
}

// Static functions.

jsb.Node._findComponent = function (node, constructor) {
    const cls = constructor as any;
    const comps = node._components;
    if (cls._sealed) {
        for (let i = 0; i < comps.length; ++i) {
            const comp = comps[i];
            if (comp.constructor === constructor) {
                return comp;
            }
        }
    } else {
        for (let i = 0; i < comps.length; ++i) {
            const comp = comps[i];
            if (comp instanceof constructor) {
                return comp;
            }
        }
    }
    return null;
}

jsb.Node._findComponents = function (node, constructor, components) {
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
}

jsb.Node._findChildComponent = function (children, constructor) {
    for (let i = 0; i < children.length; ++i) {
        const node = children[i];
        let comp = jsb.Node._findComponent(node, constructor);
        if (comp) {
            return comp;
        }

        let childChildren = node.getChildren();
        if (childChildren.length > 0) {
            comp = jsb.Node._findChildComponent(childChildren, constructor);
            if (comp) {
                return comp;
            }
        }
    }
    return null;
}

jsb.Node._findChildComponents = function (children, constructor, components) {
    for (let i = 0; i < children.length; ++i) {
        const node = children[i];
        jsb.Node._findComponents(node, constructor, components);

        let childChildren = node.getChildren();
        if (childChildren.length > 0) {
            jsb.Node._findChildComponents(childChildren, constructor, components);
        }
    }
}

export const Node = jsb.Node;
