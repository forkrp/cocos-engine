declare const cc: any;

import * as js from '../utils/js';
import { legacyCC } from '../global-exports';
import { errorID, getError } from '../platform/debug';
import { Component } from '../components/component';
import { NodeEventType } from './node-event';
import { CCObject } from '../data/object';

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


cc.Node.prototype._ctor = function (name?: string) {
    this._components = [];
    this._eventProcessor = new legacyCC.NodeEventProcessor(this);
}
Object.defineProperties(cc.Node.prototype, {
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

cc.Node.prototype.getComponent = function (typeOrClassName) {
    const constructor = getConstructor(typeOrClassName);
    if (constructor) {
        return cc.Node._findComponent(this, constructor);
    }
    return null;
}

cc.Node.prototype.getComponents = function (typeOrClassName) {
    const constructor = getConstructor(typeOrClassName);
    const components = [];
    if (constructor) {
        cc.Node._findComponents(this, constructor, components);
    }
    return components;
}

cc.Node.prototype.getComponentInChildren = function (typeOrClassName) {
    const constructor = getConstructor(typeOrClassName);
    if (constructor) {
        return cc.Node._findChildComponent(this._children, constructor);
    }
    return null;
}

cc.Node.prototype.getComponentsInChildren = function (typeOrClassName) {
    const constructor = getConstructor(typeOrClassName);
    const components = [];
    if (constructor) {
        cc.Node._findComponents(this, constructor, components);
        cc.Node._findChildComponents(this.getChildren(), constructor, components);
    }
    return components;
}

cc.Node.prototype.addComponent = function (typeOrClassName) {
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

cc.Node.prototype.removeComponent = function (component) {
    if (!component) {
        errorID(3813);
        return;
    }
    let componentInstance = null;
    if (component instanceof Component) {
        componentInstance = component;
    } else {
        componentInstance = this.getComponent(component);
    }
    if (componentInstance) {
        componentInstance.destroy();
    }
}

cc.Node.prototype.on = function (type, callback, target, useCapture) {
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

cc.Node.prototype.off = function (type: string, callback?, target?, useCapture = false) {
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

cc.Node.prototype.once = function (type: string, callback, target?: unknown, useCapture?: any) {
    this._eventProcessor.once(type, callback, target, useCapture);
}

cc.Node.prototype.emit = function (type: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any) {
    this._eventProcessor.emit(type, arg0, arg1, arg2, arg3, arg4);
}

cc.Node.prototype.dispatchEvent = function (event: Event) {
    this._eventProcessor.dispatchEvent(event);
}

cc.Node.prototype.hasEventListener = function (type: string, callback?, target?: unknown) {
    return this._eventProcessor.hasEventListener(type, callback, target);
}

cc.Node.prototype.targetOff = function (target: string | unknown) {
    // Check for event mask reset
    let eventMask = this.getEventMask();
    if ((eventMask & TRANSFORM_ON) && !this._eventProcessor.hasEventListener(NodeEventType.TRANSFORM_CHANGED)) {
        // this._eventMask &= ~TRANSFORM_ON;
        this.setEventMask(eventMask & TRANSFORM_ON);
    }
}

cc.Node.prototype._removeComponent = function (component: Component) {
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

// Static functions.

cc.Node._findComponent = function (node, constructor) {
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

cc.Node._findComponents = function (node, constructor, components) {
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

cc.Node._findChildComponent = function (children, constructor) {
    for (let i = 0; i < children.length; ++i) {
        const node = children[i];
        let comp = cc.Node._findComponent(node, constructor);
        if (comp) {
            return comp;
        }

        let childChildren = node.getChildren();
        if (childChildren.length > 0) {
            comp = cc.Node._findChildComponent(childChildren, constructor);
            if (comp) {
                return comp;
            }
        }
    }
    return null;
}

cc.Node._findChildComponents = function (children, constructor, components) {
    for (let i = 0; i < children.length; ++i) {
        const node = children[i];
        cc.Node._findComponents(node, constructor, components);

        let childChildren = node.getChildren();
        if (childChildren.length > 0) {
            cc.Node._findChildComponents(childChildren, constructor, components);
        }
    }
}
