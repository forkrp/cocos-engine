import {CommandQueue, CommandQueueManager} from "./node-command-queue.jsb";
import {NodeEventType} from "../node-event";
import {NodeSpace, TransformBit} from "../node-enum";
import {Mat4, Quat, Vec3} from "../../math";

// For optimize getPosition, getRotation, getScale
export const _tempFloatArray = new Float32Array([
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0
]);
//
export function initNodeCommandHandlerPart () {
// @ts-ignore
    const Node: any = jsb.Node;
    const nodeProto: any = Node.prototype;

    const NODE_QUEUE_SIZE_IN_BYTES = (1024 * 1024); // 1MB

    const NODE_COMMAND_START_INDEX = 10;
    const NODE_COMMAND_SET_POSITION = NODE_COMMAND_START_INDEX + 1;
    const NODE_COMMAND_SET_ROTATION = NODE_COMMAND_START_INDEX + 2;
    const NODE_COMMAND_SET_SCALE = NODE_COMMAND_START_INDEX + 3;
    const NODE_COMMAND_SET_ROTATION_FROM_EULER = NODE_COMMAND_START_INDEX + 4;
    const NODE_COMMAND_SET_RTS = NODE_COMMAND_START_INDEX + 5;
    const NODE_COMMAND_SET_WORLD_POSITION = NODE_COMMAND_START_INDEX + 6;
    const NODE_COMMAND_SET_WORLD_ROTATION = NODE_COMMAND_START_INDEX + 7;
    const NODE_COMMAND_SET_WORLD_SCALE = NODE_COMMAND_START_INDEX + 8;
    const NODE_COMMAND_SET_MATRIX = NODE_COMMAND_START_INDEX + 9;
    const NODE_COMMAND_TRANSLATE = NODE_COMMAND_START_INDEX + 10;
    const NODE_COMMAND_ROTATE = NODE_COMMAND_START_INDEX + 11;
    const NODE_COMMAND_LOOK_AT = NODE_COMMAND_START_INDEX + 12;
    const NODE_COMMAND_UPDATE_WORLD_TRANSFORM = NODE_COMMAND_START_INDEX + 13;
    const NODE_COMMAND_SET_ANGLE = NODE_COMMAND_START_INDEX + 14;
    const NODE_COMMAND_SET_FORWARD = NODE_COMMAND_START_INDEX + 15;

    const NODE_COMMAND_UPDATE_SIBLING_INDEX = NODE_COMMAND_START_INDEX + 16;
    const NODE_COMMAND_SET_ACTIVE = NODE_COMMAND_START_INDEX + 17;
    const NODE_COMMAND_SET_SIBLING_INDEX = NODE_COMMAND_START_INDEX + 18;
    const NODE_COMMAND_SET_PERSIS_NODE = NODE_COMMAND_START_INDEX + 19;
    const NODE_COMMAND_INVALIDATE_CHILDREN = NODE_COMMAND_START_INDEX + 20;
    const NODE_COMMAND_SET_CHANGED_FLAGS = NODE_COMMAND_START_INDEX + 21;
    const NODE_COMMAND_SET_DIRTY_FLAG = NODE_COMMAND_START_INDEX + 22;
    const NODE_COMMAND_SET_EVENT_MASK = NODE_COMMAND_START_INDEX + 23;

    const oldGetWorldPosition = nodeProto.getWorldPosition;
    const oldGetWorldRotation = nodeProto.getWorldRotation;
    const oldGetWorldScale = nodeProto.getWorldScale;
    const oldGetEulerAngles = nodeProto.getEulerAngles;
    const oldGetWorldMatrix = nodeProto.getWorldMatrix;
    const oldGetForward = nodeProto.getForward;
    const oldGetUp = nodeProto.getUp;
    const oldGetRight = nodeProto.getRight;

    const oldInverseTransformPoint = nodeProto.inverseTransformPoint;
    const oldGetWorldRS = nodeProto.getWorldRS;
    const oldGetWorldRT = nodeProto.getWorldRT;
    const oldGetAngle = nodeProto.getAngle;
    const oldIsChildOf = nodeProto.isChildOf;
    const oldIsPersistNode = nodeProto.isPersistNode;
    const oldIsActive = nodeProto.isActive;
    const oldGetChildByUuid = nodeProto.getChildByUuid;
    const oldGetChildByName = nodeProto.getChildByName;
    const oldGetChildByPath = nodeProto.getChildByPath;
    const oldGetSiblingIndex = nodeProto.getSiblingIndex;
    const oldInsertChild = nodeProto.insertChild;
    const oldGetChangedFlags = nodeProto.getChangedFlags;
    const oldGetDirtyFlag = nodeProto.getDirtyFlag;
    const oldGetEventMask = nodeProto.getEventMask;

    const oldSetParent = nodeProto.setParent;
    const oldDestroy = nodeProto.destroy;
    const oldDestroyAllChildren = nodeProto.destroyAllChildren;
    const oldAddChild = nodeProto.addChild;
    const oldRemoveChild = nodeProto.removeChild;
    const oldRemoveFromParent = nodeProto.removeFromParent;
    const oldRemoveAllChildren = nodeProto.removeAllChildren;
    const oldWalk = nodeProto.walk;

    const NODE_COMMAND_HEAD_BYTES = (4 + 8);
    const NODE_COMMAND_0_FLOAT_BYTES = NODE_COMMAND_HEAD_BYTES;
    const NODE_COMMAND_1_FLOAT_BYTES = NODE_COMMAND_HEAD_BYTES + (4);
    const NODE_COMMAND_2_FLOAT_BYTES = NODE_COMMAND_HEAD_BYTES + (2 * 4);
    const NODE_COMMAND_3_FLOAT_BYTES = NODE_COMMAND_HEAD_BYTES + (3 * 4);
    const NODE_COMMAND_4_FLOAT_BYTES = NODE_COMMAND_HEAD_BYTES + (4 * 4);
    const NODE_COMMAND_16_FLOAT_BYTES = NODE_COMMAND_HEAD_BYTES + (16 * 4);

    Node.EventType = NodeEventType;
    Node.NodeSpace = NodeSpace;
    Node.TransformDirtyBit = TransformBit;
    Node.TransformBit = TransformBit;

    Node._setTempFloatArray(_tempFloatArray.buffer);
    const cqMgr = new CommandQueueManager(Node._flushCommandsToNative, NODE_QUEUE_SIZE_IN_BYTES);
    Node._setCommandArrayBuffer(cqMgr.queues[0].buffer, cqMgr.queues[1].buffer);

    Node.flushCommandsToNative = function () {
        cqMgr.flush();
    };

    let isUpdateWorldTransformRecursively: boolean = false;
    Node.setUpdateWorldTransformRecursively = function (v: boolean) {
        isUpdateWorldTransformRecursively = v;
    };

    function convertFloat32ArrayToMat4(out: Mat4, arr: Float32Array): Mat4 {
        return out.set(
            arr[0], arr[1], arr[2], arr[3],
            arr[4], arr[5], arr[6], arr[7],
            arr[8], arr[9], arr[10], arr[11],
            arr[12], arr[13], arr[14], arr[15],
        );
    }

    function assertIfCommandQueueNotEmpty() {
        if (!cqMgr.isEmpty()) {
            throw new Error(`Node command queue is not empty with size: ${cqMgr.length}`);
        }
    }

// Async functions

    nodeProto.setRTS = function setRTS(rot?: Quat | Vec3, pos?: Vec3, scale?: Vec3) {
        this._needUpdatelocalPRS = true;
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_HEAD_BYTES + 3 + (4 * (3 + 4 + 3)));
        commandQueue.pushUint8(NODE_COMMAND_SET_RTS);
        commandQueue.pushBigUint64(this.__native_ptr__);

        if (pos) {
            const lpos = this._lpos = pos;
            commandQueue.pushUint8(1);
            commandQueue.pushFloat32(lpos.x);
            commandQueue.pushFloat32(lpos.y);
            commandQueue.pushFloat32(lpos.z);
        } else {
            commandQueue.pushUint8(0);
        }

        if (rot) {
            if ((rot as Quat).w !== undefined) {
                Quat.copy(this._lrot, rot as Quat);
            } else {
                Quat.fromEuler(this._lrot, rot.x, rot.y, rot.z);
            }

            const lrot: Quat = this._lrot;
            commandQueue.pushUint8(1);
            commandQueue.pushFloat32(lrot.x);
            commandQueue.pushFloat32(lrot.y);
            commandQueue.pushFloat32(lrot.z);
            commandQueue.pushFloat32(lrot.w);
        } else {
            commandQueue.pushUint8(0);
        }

        if (scale) {
            const lscale = this._lscale = scale;
            commandQueue.pushUint8(1);
            commandQueue.pushFloat32(lscale.x);
            commandQueue.pushFloat32(lscale.y);
            commandQueue.pushFloat32(lscale.z);
        } else {
            commandQueue.pushUint8(0);
        }

        commandQueue.commit();
    };

    nodeProto.setPosition = function setPosition(val: Readonly<Vec3> | number, y?: number, z?: number) {
        const lpos = this._lpos;
        if (y === undefined && z === undefined) {
            Vec3.copy(lpos, val as Vec3);
        } else if (z === undefined) {
            lpos.set(val, y, lpos.z);
        } else {
            lpos.set(val as number, y, z);
        }
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_3_FLOAT_BYTES);
        commandQueue.pushUint8(NODE_COMMAND_SET_POSITION);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushFloat32(lpos.x);
        commandQueue.pushFloat32(lpos.y);
        commandQueue.pushFloat32(lpos.z);
        commandQueue.commit();
    };

    nodeProto.setRotation = function setRotation(val: Readonly<Quat> | number, y?: number, z?: number, w?: number): void {
        const lrot = this._lrot;
        if (y === undefined || z === undefined || w === undefined) {
            lrot.set(val as Readonly<Quat>);
        } else {
            lrot.set(val as number, y, z, w);
        }
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_4_FLOAT_BYTES);
        commandQueue.pushUint8(NODE_COMMAND_SET_ROTATION);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushFloat32(lrot.x);
        commandQueue.pushFloat32(lrot.y);
        commandQueue.pushFloat32(lrot.z);
        commandQueue.pushFloat32(lrot.w);
        commandQueue.commit();
    };

    nodeProto.setRotationFromEuler = function setRotationFromEuler(val: Vec3 | number, y?: number, zOpt?: number): void {
        const z = zOpt === undefined ? this._euler.z : zOpt;
        const euler = this._euler;
        if (y === undefined) {
            Vec3.copy(euler, val as Vec3);
        } else {
            euler.set(val as number, y, z);
        }
        this._needUpdatelocalPRS = true;
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_3_FLOAT_BYTES);
        commandQueue.pushUint8(NODE_COMMAND_SET_ROTATION_FROM_EULER);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushFloat32(euler.x);
        commandQueue.pushFloat32(euler.y);
        commandQueue.pushFloat32(euler.z);
        commandQueue.commit();
    };

    nodeProto.setScale = function setScale(val: Readonly<Vec3> | number, y?: number, z?: number) {
        const lscale = this._lscale;
        if (y === undefined && z === undefined) {
            Vec3.copy(lscale, val as Vec3);
        } else if (z === undefined) {
            lscale.set(val as number, y, lscale.z);
        } else {
            lscale.set(val as number, y, z);
        }
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_3_FLOAT_BYTES);
        commandQueue.pushUint8(NODE_COMMAND_SET_SCALE);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushFloat32(lscale.x);
        commandQueue.pushFloat32(lscale.y);
        commandQueue.pushFloat32(lscale.z);
        commandQueue.commit();
    };

    nodeProto.setWorldPosition = function setWorldPosition(val: Vec3 | number, y?: number, z?: number): void {
        this._needUpdatelocalPRS = true;
        const position = this._worldPositionCache;
        if (y === undefined || z === undefined) {
            Vec3.copy(position, val as Vec3);
        } else {
            Vec3.set(position, val as number, y, z);
        }
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_3_FLOAT_BYTES);
        commandQueue.pushUint8(NODE_COMMAND_SET_WORLD_POSITION);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushFloat32(position.x);
        commandQueue.pushFloat32(position.y);
        commandQueue.pushFloat32(position.z);
        commandQueue.commit();
    };

    nodeProto.setWorldRotation = function setWorldRotation(val: Quat | number, y?: number, z?: number, w?: number): void {
        this._needUpdatelocalPRS = true;
        const quat = this._worldRotationCache;
        if (y === undefined || z === undefined || w === undefined) {
            Quat.copy(quat, val as Quat);
        } else {
            Quat.set(quat, val as number, y, z, w);
        }
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_4_FLOAT_BYTES);
        commandQueue.pushUint8(NODE_COMMAND_SET_WORLD_ROTATION);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushFloat32(quat.x);
        commandQueue.pushFloat32(quat.y);
        commandQueue.pushFloat32(quat.z);
        commandQueue.pushFloat32(quat.w);
        commandQueue.commit();
    };

    nodeProto.setWorldScale = function setWorldScale(val: Vec3 | number, y?: number, z?: number): void {
        this._needUpdatelocalPRS = true;
        const scale = this._worldScaleCache;
        if (y === undefined || z === undefined) {
            Vec3.copy(this._scale, val as Vec3);
        } else {
            Vec3.set(this._scale, val as number, y, z);
        }
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_3_FLOAT_BYTES);
        commandQueue.pushUint8(NODE_COMMAND_SET_WORLD_SCALE);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushFloat32(scale.x);
        commandQueue.pushFloat32(scale.y);
        commandQueue.pushFloat32(scale.z);
        commandQueue.commit();
    };

    nodeProto.setMatrix = function setMatrix(mat: Readonly<Mat4>) {
        this._needUpdatelocalPRS = true;
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_16_FLOAT_BYTES);
        commandQueue.pushUint8(NODE_COMMAND_SET_MATRIX);
        commandQueue.pushBigUint64(this.__native_ptr__);
        for (let i = 0; i < 16; ++i) {
            commandQueue.pushFloat32(mat[i]);
        }
        commandQueue.commit();
    };

    nodeProto.rotate = function (rot: Quat, ns?: NodeSpace): void {
        this._needUpdatelocalPRS = true;
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_4_FLOAT_BYTES + 1 + 4);
        commandQueue.pushUint8(NODE_COMMAND_ROTATE);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushFloat32(rot.x);
        commandQueue.pushFloat32(rot.y);
        commandQueue.pushFloat32(rot.z);
        commandQueue.pushFloat32(rot.w);

        if (ns) {
            commandQueue.pushUint8(1);
            commandQueue.pushUint32(ns);
        } else {
            commandQueue.pushUint8(0);
        }
        commandQueue.commit();
    };

    nodeProto.translate = function (trans: Vec3, ns?: NodeSpace): void {
        this._needUpdatelocalPRS = true;
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_3_FLOAT_BYTES + 1 + 4);
        commandQueue.pushUint8(NODE_COMMAND_TRANSLATE);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushFloat32(trans.x);
        commandQueue.pushFloat32(trans.y);
        commandQueue.pushFloat32(trans.z);

        if (ns) {
            commandQueue.pushUint8(1);
            commandQueue.pushUint32(ns);
        } else {
            commandQueue.pushUint8(0);
        }
        commandQueue.commit();
    };

    nodeProto.lookAt = function lookAt(pos: Readonly<Vec3>, up?: Readonly<Vec3>) {
        this._needUpdatelocalPRS = true;
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_3_FLOAT_BYTES + NODE_COMMAND_3_FLOAT_BYTES + 1);
        commandQueue.pushUint8(NODE_COMMAND_LOOK_AT);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushFloat32(pos.x);
        commandQueue.pushFloat32(pos.y);
        commandQueue.pushFloat32(pos.z);
        if (up) {
            commandQueue.pushUint8(1);
            commandQueue.pushFloat32(up.x);
            commandQueue.pushFloat32(up.y);
            commandQueue.pushFloat32(up.z);
        } else {
            commandQueue.pushUint8(0);
        }
        commandQueue.commit();
    };

    nodeProto.updateWorldTransform = function () {
        if (isUpdateWorldTransformRecursively) {
            assertIfCommandQueueNotEmpty();
            return;
        }
        this._needUpdatelocalPRS = true;
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_0_FLOAT_BYTES);
        commandQueue.pushUint8(NODE_COMMAND_UPDATE_WORLD_TRANSFORM);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.commit();
    };

    nodeProto.setAngle = function setAngle(v: number) {
        this._needUpdatelocalPRS = true;
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_1_FLOAT_BYTES);
        commandQueue.pushUint8(NODE_COMMAND_SET_ANGLE);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushFloat32(v);
        commandQueue.commit();
    };

    nodeProto.setForward = function setForward(dir: Vec3) {
        this._needUpdatelocalPRS = true;
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_3_FLOAT_BYTES);
        commandQueue.pushUint8(NODE_COMMAND_SET_FORWARD);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushFloat32(dir.x);
        commandQueue.pushFloat32(dir.y);
        commandQueue.pushFloat32(dir.z);
        commandQueue.commit();
    };

    nodeProto._updateSiblingIndex = function _updateSiblingIndex() {
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_0_FLOAT_BYTES);
        commandQueue.pushUint8(NODE_COMMAND_UPDATE_SIBLING_INDEX);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.commit();
    };

    nodeProto.setActive = function setActive(v: boolean) {
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_HEAD_BYTES + 1);
        commandQueue.pushUint8(NODE_COMMAND_SET_ACTIVE);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushBool(v);
        commandQueue.commit();
    };

    nodeProto.setSiblingIndex = function setSiblingIndex(v: number) {
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_HEAD_BYTES + 4);
        commandQueue.pushUint8(NODE_COMMAND_SET_SIBLING_INDEX);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushInt32(v);
        commandQueue.commit();
    };

    nodeProto.setPersistNode = function setPersistNode(v: boolean) {
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_HEAD_BYTES + 1);
        commandQueue.pushUint8(NODE_COMMAND_SET_PERSIS_NODE);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushBool(v);
        commandQueue.commit();
    };

    nodeProto.invalidateChildren = function invalidateChildren(dirtyBit: TransformBit) {
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_HEAD_BYTES + 4);
        commandQueue.pushUint8(NODE_COMMAND_INVALIDATE_CHILDREN);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushUint32(dirtyBit);
        commandQueue.commit();
    };

    nodeProto.setChangedFlags = function setChangedFlags(v: number) {
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_HEAD_BYTES + 4);
        commandQueue.pushUint8(NODE_COMMAND_SET_CHANGED_FLAGS);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushUint32(v);
        commandQueue.commit();
    };

    nodeProto.setDirtyFlag = function setDirtyFlag(v: number) {
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_HEAD_BYTES + 4);
        commandQueue.pushUint8(NODE_COMMAND_SET_DIRTY_FLAG);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushUint32(v);
        commandQueue.commit();
    };

    nodeProto.setEventMask = function setEventMask(v: number) {
        const commandQueue = cqMgr.getCommandQueue();
        commandQueue.ensureEnoughSpace(NODE_COMMAND_HEAD_BYTES + 4);
        commandQueue.pushUint8(NODE_COMMAND_SET_EVENT_MASK);
        commandQueue.pushBigUint64(this.__native_ptr__);
        commandQueue.pushUint32(v);
        commandQueue.commit();
    };

// Sync functions
    nodeProto.inverseTransformPoint = function (out: Vec3, p: Vec3) {
        Node.flushCommandsToNative();
        const target = out || this._inverseTransformPointCache;
        _tempFloatArray[0] = p.x;
        _tempFloatArray[1] = p.y;
        _tempFloatArray[2] = p.z;
        oldInverseTransformPoint.call(this);
        target.x = _tempFloatArray[0];
        target.y = _tempFloatArray[1];
        target.z = _tempFloatArray[2];
        return target;
    };

    nodeProto.getPosition = function getPosition(out?: Vec3): Vec3 {
        if (out) {
            return Vec3.set(out, this._lpos.x, this._lpos.y, this._lpos.z);
        }
        return Vec3.copy(this._positionCache, this._lpos);
    };

    nodeProto.getRotation = function (out?: Quat): Quat {
        if (out) {
            return Quat.set(out, this._lrot.x, this._lrot.y, this._lrot.z, this._lrot.w);
        }
        return Quat.copy(this._rotationCache, this._lrot);
    };

    nodeProto.getScale = function getScale(out?: Vec3): Vec3 {
        if (out) {
            return Vec3.set(out, this._lscale.x, this._lscale.y, this._lscale.z);
        }
        return Vec3.copy(this._scaleCache, this._lscale);
    };

    nodeProto.getWorldPosition = function getWorldPosition(out?: Vec3): Vec3 {
        const target: Vec3 = out || this._worldPositionCache;
        if (isUpdateWorldTransformRecursively) {
            assertIfCommandQueueNotEmpty();
            const arr = this._worldPositionArr;
            target.set(arr[0], arr[1], arr[2]);
            return target;
        }

        Node.flushCommandsToNative();
        oldGetWorldPosition.call(this);
        return Vec3.set(target, _tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
    };

    nodeProto.getWorldRotation = function getWorldRotation(out?: Quat): Quat {
        const target: Quat = out || this._worldRotationCache;
        if (isUpdateWorldTransformRecursively) {
            assertIfCommandQueueNotEmpty();
            const arr = this._worldRotationArr;
            target.set(arr[0], arr[1], arr[2], arr[3]);
            return target;
        }

        Node.flushCommandsToNative();
        oldGetWorldRotation.call(this);
        return Quat.set(target, _tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2], _tempFloatArray[3]);
    };

    nodeProto.getWorldScale = function getWorldScale(out?: Vec3): Vec3 {
        const target: Vec3 = out || this._worldScaleCache;
        if (isUpdateWorldTransformRecursively) {
            assertIfCommandQueueNotEmpty();
            const arr = this._worldScaleArr;
            target.set(arr[0], arr[1], arr[2]);
            return target;
        }

        Node.flushCommandsToNative();
        oldGetWorldScale.call(this);
        return Vec3.set(target, _tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
    };

    nodeProto.getWorldMatrix = function getWorldMatrix(out?: Mat4): Mat4 {
        const target = out || this._worldMatrixCache;
        if (isUpdateWorldTransformRecursively) {
            assertIfCommandQueueNotEmpty();
            return convertFloat32ArrayToMat4(target, this._worldMatrixArr);
        }

        Node.flushCommandsToNative();
        oldGetWorldMatrix.call(this);
        return convertFloat32ArrayToMat4(target, _tempFloatArray);
    };

    nodeProto.getEulerAngles = function (out?: Vec3): Vec3 {
        Node.flushCommandsToNative();
        const target = out || this._eulerAnglesCache;
        oldGetEulerAngles.call(this);
        return Vec3.set(target, _tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
    };

    nodeProto.getForward = function (out?: Vec3): Vec3 {
        Node.flushCommandsToNative();
        const target = out || this._forwardCache;
        oldGetForward.call(this);
        return Vec3.set(target, _tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
    };

    nodeProto.getUp = function (out?: Vec3): Vec3 {
        Node.flushCommandsToNative();
        const target = out || this._upCache;
        oldGetUp.call(this);
        return Vec3.set(target, _tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
    };

    nodeProto.getRight = function (out?: Vec3): Vec3 {
        Node.flushCommandsToNative();
        const target = out || this._rightCache;
        oldGetRight.call(this);
        return Vec3.set(target, _tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
    };

    nodeProto.getWorldRT = function (out?: Mat4) {
        Node.flushCommandsToNative();
        oldGetWorldRT.call(this);
        const target = out || this._worldRTCache;
        return convertFloat32ArrayToMat4(target, _tempFloatArray);
    };

    nodeProto.getWorldRS = function (out?: Mat4) {
        Node.flushCommandsToNative();
        oldGetWorldRS.call(this);
        const target = out || this._worldRSCache;
        return convertFloat32ArrayToMat4(target, _tempFloatArray);
    };

    nodeProto.getAngle = function getAngle() {
        Node.flushCommandsToNative();
        oldGetAngle.call(this);
        return _tempFloatArray[0];
    };

    nodeProto.isChildOf = function isChildOf(parent): boolean {
        Node.flushCommandsToNative();
        return oldIsChildOf.call(this, parent);
    };

    nodeProto.isPersistNode = function isPersistNode(): boolean {
        Node.flushCommandsToNative();
        return oldIsPersistNode.call(this);
    }

    nodeProto.isActive = function isActive(): boolean {
        Node.flushCommandsToNative();
        return oldIsActive.call(this);
    };

    nodeProto.getChildByUuid = function getChildByUuid(uuid: string) {
        Node.flushCommandsToNative();
        return oldGetChildByUuid.call(this, uuid);
    };

    nodeProto.getChildByName = function getChildByUuid(name: string) {
        Node.flushCommandsToNative();
        return oldGetChildByName.call(this, name);
    };

    nodeProto.getChildByPath = function getChildByUuid(path: string) {
        Node.flushCommandsToNative();
        return oldGetChildByPath.call(this, path);
    };

    nodeProto.getSiblingIndex = function getSiblingIndex() {
        Node.flushCommandsToNative();
        return oldGetSiblingIndex.call(this);
    };

    nodeProto.insertChild = function insertChild(child: Node, siblingIndex: number) {
        Node.flushCommandsToNative();
        oldInsertChild(child, siblingIndex);
    };

    nodeProto.getChangedFlags = function getChangedFlags() {
        Node.flushCommandsToNative();
        return oldGetChangedFlags.call(this);
    };

    nodeProto.getDirtyFlag = function getDirtyFlag() {
        Node.flushCommandsToNative();
        return oldGetDirtyFlag.call(this);
    };

    nodeProto.getEventMask = function getEventMask() {
        Node.flushCommandsToNative();
        return oldGetEventMask.call(this);
    };

    nodeProto.setParent = function setParent() {
        Node.flushCommandsToNative();
        oldSetParent.apply(this, arguments);
    };

    nodeProto.destroy = function destroy() {
        Node.flushCommandsToNative();
        return oldDestroy.call(this);
    };

    nodeProto.destroyAllChildren = function destroyAllChildren() {
        Node.flushCommandsToNative();
        oldDestroyAllChildren.call(this);
    };

    nodeProto.addChild = function addChild() {
        Node.flushCommandsToNative();
        oldAddChild.apply(this, arguments);
    };

    nodeProto.removeChild = function removeChild() {
        Node.flushCommandsToNative();
        oldRemoveChild.apply(this, arguments);
    };

    nodeProto.removeFromParent = function removeFromParent() {
        Node.flushCommandsToNative();
        oldRemoveFromParent.apply(this, arguments);
    };

    nodeProto.removeAllChildren = function removeAllChildren() {
        Node.flushCommandsToNative();
        oldRemoveAllChildren.apply(this, arguments);
    };

    nodeProto.walk = function walk() {
        Node.flushCommandsToNative();
        oldWalk.apply(this, arguments);
    }
}
