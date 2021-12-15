import {getClassByName, isChildClassOf} from "../../utils/js-typed";
import {legacyCC} from "../../global-exports";
import {errorID, getError} from "../../platform/debug";
import {Component} from "../../components/component";
import {CCObject} from "../../data/object";

export function initNodeComponentPart () {
// @ts-ignore
    const Node: any = jsb.Node;
    const nodeProto: any = Node.prototype;

    const Destroying = CCObject.Flags.Destroying;

    function getConstructor<T>(typeOrClassName) {
        if (!typeOrClassName) {
            return null;
        }
        if (typeof typeOrClassName === 'string') {
            return getClassByName(typeOrClassName);
        }

        return typeOrClassName;
    }

    nodeProto.getComponent = function (typeOrClassName) {
        const constructor = getConstructor(typeOrClassName);
        if (constructor) {
            return Node._findComponent(this, constructor);
        }
        return null;
    };

    nodeProto.getComponents = function (typeOrClassName) {
        const constructor = getConstructor(typeOrClassName);
        const components = [];
        if (constructor) {
            Node._findComponents(this, constructor, components);
        }
        return components;
    };

    nodeProto.getComponentInChildren = function (typeOrClassName) {
        const constructor = getConstructor(typeOrClassName);
        if (constructor) {
            return Node._findChildComponent(this._children, constructor);
        }
        return null;
    };

    nodeProto.getComponentsInChildren = function (typeOrClassName) {
        const constructor = getConstructor(typeOrClassName);
        const components = [];
        if (constructor) {
            Node._findComponents(this, constructor, components);
            Node._findChildComponents(this.children, constructor, components);
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
            constructor = getClassByName(typeOrClassName);
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
        if (!isChildClassOf(constructor, Component)) {
            throw TypeError(getError(3810));
        }

        // if (EDITOR && (constructor as typeof constructor & { _disallowMultiple?: unknown })._disallowMultiple) {
        //     this._checkMultipleComp!(constructor);
        // }

        // check requirement

        const ReqComp = (constructor)._requireComponent;
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

    Node._findComponent = function (node, constructor) {
        const cls = constructor;
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

    Node._findComponents = function (node, constructor, components) {
        const cls = constructor;
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

    Node._findChildComponent = function (children, constructor) {
        for (let i = 0; i < children.length; ++i) {
            const node = children[i];
            let comp: Component = Node._findComponent(node, constructor);
            if (comp) {
                return comp;
            }

            const childChildren = node.children;
            if (childChildren.length > 0) {
                comp = Node._findChildComponent(childChildren, constructor);
                if (comp) {
                    return comp;
                }
            }
        }
        return null;
    };

    Node._findChildComponents = function (children, constructor, components) {
        for (let i = 0; i < children.length; ++i) {
            const node = children[i];
            Node._findComponents(node, constructor, components);

            const childChildren = node.children;
            if (childChildren.length > 0) {
                Node._findChildComponents(childChildren, constructor, components);
            }
        }
    };
}
