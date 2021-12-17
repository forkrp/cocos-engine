import {Mat4, Quat, Vec3} from "../../math";
import {NodeEventType} from "../node-event";

export function initNodePropertiesPart () {

// @ts-ignore
    const Node: any = jsb.Node;
    const nodeProto: any = Node.prototype;

    Object.defineProperty(nodeProto, 'angle', {
        configurable: true,
        enumerable: true,
        get() {
            return this.getAngle();
        },
        set(v) {
            this.setAngle(v);
        }
    });

    Object.defineProperty(nodeProto, 'position', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Vec3> {
            if (this._needUpdatelocalPRS) {
                Node.flushCommandsToNative();
                this._needUpdatelocalPRS = false;
            }
            return this._lpos;
        },
        set(v: Readonly<Vec3>) {
            this.setPosition(v as Vec3);
        },
    });

    Object.defineProperty(nodeProto, 'matrix', {
        configurable: true,
        enumerable: true,
        set(v: Mat4) {
            this.setMatrix(v);
        }
    });

    Object.defineProperty(nodeProto, 'rotation', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Quat> {
            if (this._needUpdatelocalPRS) {
                Node.flushCommandsToNative();
                this._needUpdatelocalPRS = false;
            }
            return this._lrot;
        },
        set(v: Readonly<Quat>) {
            this.setRotation(v as Quat);
        },
    });

    Object.defineProperty(nodeProto, 'scale', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Vec3> {
            if (this._needUpdatelocalPRS) {
                Node.flushCommandsToNative();
                this._needUpdatelocalPRS = false;
            }
            return this._lscale;
        },
        set(v: Readonly<Vec3>) {
            this.setScale(v as Vec3);
        },
    });

    Object.defineProperty(nodeProto, 'worldPosition', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Vec3> {
            return this.getWorldPosition();
        },
        set(v: Readonly<Vec3>) {
            this.setWorldPosition(v as Vec3);
        },
    });

    Object.defineProperty(nodeProto, 'worldRotation', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Quat> {
            return this.getWorldRotation();
        },
        set(v: Readonly<Quat>) {
            this.setWorldRotation(v as Quat);
        },
    });

    Object.defineProperty(nodeProto, 'worldScale', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Vec3> {
            return this.getWorldScale();
        },
        set(v: Readonly<Vec3>) {
            this.setWorldScale(v as Vec3);
        },
    });

    Object.defineProperty(nodeProto, '_pos', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Vec3> {
            return this.getWorldPosition();
        }
    });

    Object.defineProperty(nodeProto, '_rot', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Quat> {
            return this.getWorldRotation();
        }
    });

    Object.defineProperty(nodeProto, '_scale', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Vec3> {
            return this.getWorldScale();
        }
    });

    Object.defineProperty(nodeProto, 'eulerAngles', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Vec3> {
            return this.getEulerAngles();
        },
        set(v: Readonly<Vec3>) {
            this.setRotationFromEuler(v.x, v.y, v.z);
        },
    });

    Object.defineProperty(nodeProto, 'worldMatrix', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Mat4> {
            return this.getWorldMatrix();
        },
    });

    Object.defineProperty(nodeProto, '_mat', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Mat4> {
            return this.getWorldMatrix();
        },
    });

    Object.defineProperty(nodeProto, 'activeInHierarchy', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Boolean> {
            return this._activeInHierarchyArr[0] !== 0;
        },
        set(v) {
            this._activeInHierarchyArr[0] = (v ? 1 : 0);
        },
    });

    Object.defineProperty(nodeProto, '_activeInHierarchy', {
        configurable: true,
        enumerable: true,
        get(): Readonly<Boolean> {
            return this._activeInHierarchyArr[0] !== 0;
        },
        set(v) {
            this._activeInHierarchyArr[0] = (v ? 1 : 0);
        },
    });

    Object.defineProperty(nodeProto, 'layer', {
        configurable: true,
        enumerable: true,
        get() {
            return this._layerArr[0];
        },
        set(v) {
            this._layerArr[0] = v;
            this.emit(NodeEventType.LAYER_CHANGED, v);
        },
    });

    Object.defineProperty(nodeProto, '_layer', {
        configurable: true,
        enumerable: true,
        get() {
            return this._layerArr[0];
        },
        set(v) {
            this._layerArr[0] = v;
        },
    });

    Object.defineProperty(nodeProto, 'forward', {
        configurable: true,
        enumerable: true,
        get(): Vec3 {
            return this.getForward();
        },
        set(dir: Vec3) {
            this.setForward(dir);
        },
    });

    Object.defineProperty(nodeProto, 'up', {
        configurable: true,
        enumerable: true,
        get(): Vec3 {
            return this.getUp();
        },
    });

    Object.defineProperty(nodeProto, 'right', {
        configurable: true,
        enumerable: true,
        get(): Vec3 {
            return this.getRight();
        },
    });

    Object.defineProperty(nodeProto, 'eventProcessor', {
        configurable: true,
        enumerable: true,
        get() {
            return this._eventProcessor;
        },
    });

    Object.defineProperty(nodeProto, 'components', {
        configurable: true,
        enumerable: true,
        get() {
            return this._components;
        },
    });

    Object.defineProperty(nodeProto, '_parent', {
        configurable: true,
        enumerable: true,
        get() {
            return this._parentInternal;
        },
        set(v) {
            this._parentInternal = v;
            this._setParent(v);
        },
    });

    Object.defineProperty(nodeProto, 'parent', {
        configurable: true,
        enumerable: true,
        get() {
            return this._parentInternal;
        },
        set(v) {
            this.setParent(v);
        },
    });

    Object.defineProperty(nodeProto, 'children', {
        configurable: true,
        enumerable: true,
        get() {
            return this._children;
        },
        set(v) {
            this._children = v;
        },
    });

    Object.defineProperty(nodeProto, 'scene', {
        configurable: true,
        enumerable: true,
        get() {
            return this._scene;
        }
    });

    Object.defineProperty(nodeProto, '_persistNode', {
        configurable: true,
        enumerable: true,
        get() {
            return this.isPersistNode();
        },
        set(v) {
            this.setPersistNode(v);
        }
    });

    Object.defineProperty(nodeProto, '_active', {
        configurable: true,
        enumerable: true,
        get() {
            return this.isActive();
        },
        set(v) {
            this.setActive(v);
        }
    });

    Object.defineProperty(nodeProto, 'active', {
        configurable: true,
        enumerable: true,
        get() {
            return this.isActive();
        },
        set(v) {
            this.setActive(v);
        }
    });

    Object.defineProperty(nodeProto, 'hasChangedFlags', {
        configurable: true,
        enumerable: true,
        get() {
            return this.getChangedFlags();
        },
        set(v) {
            this.setChangedFlags(v);
        }
    });

    Object.defineProperty(nodeProto, '_dirtyFlags', {
        configurable: true,
        enumerable: true,
        get() {
            return this.getDirtyFlag();
        },
        set(v) {
            this.setDirtyFlag(v);
        }
    });
}
