import {NodeEventType} from "../node-event";

export const TRANSFORM_ON = 1 << 0;

export function initNodeEventPart () {

// @ts-ignore
    const Node: any = jsb.Node;
    const nodeProto: any = Node.prototype;

    const REGISTERED_EVENT_MASK_TRANSFORM_CHANGED = (1 << 0);
    const REGISTERED_EVENT_MASK_PARENT_CHANGED = (1 << 1);
    const REGISTERED_EVENT_MASK_LAYER_CHANGED = (1 << 2);
    const REGISTERED_EVENT_MASK_CHILD_REMOVED_CHANGED = (1 << 3);
    const REGISTERED_EVENT_MASK_CHILD_ADDED_CHANGED = (1 << 4);
    const REGISTERED_EVENT_MASK_SIBLING_ORDER_CHANGED_CHANGED = (1 << 5);

    nodeProto.on = function (type, callback, target, useCapture: any = false) {
        switch (type) {
            case NodeEventType.TRANSFORM_CHANGED:

                // this._eventMask |= TRANSFORM_ON;
                this.setEventMask(this.getEventMask() | ~TRANSFORM_ON);
                if (!(this._registeredNodeEventTypeMask & REGISTERED_EVENT_MASK_TRANSFORM_CHANGED)) {
                    this._registerOnTransformChanged();
                    this._registeredNodeEventTypeMask |= REGISTERED_EVENT_MASK_TRANSFORM_CHANGED;
                }
                break;
            case NodeEventType.PARENT_CHANGED:
                if (!(this._registeredNodeEventTypeMask & REGISTERED_EVENT_MASK_PARENT_CHANGED)) {
                    this._registerOnParentChanged();
                    this._registeredNodeEventTypeMask |= REGISTERED_EVENT_MASK_PARENT_CHANGED;
                }
                break;
            case NodeEventType.LAYER_CHANGED:
                if (!(this._registeredNodeEventTypeMask & REGISTERED_EVENT_MASK_LAYER_CHANGED)) {
                    this._registerOnLayerChanged();
                    this._registeredNodeEventTypeMask |= REGISTERED_EVENT_MASK_LAYER_CHANGED;
                }
                break;
            case NodeEventType.CHILD_REMOVED:
                if (!(this._registeredNodeEventTypeMask & REGISTERED_EVENT_MASK_CHILD_REMOVED_CHANGED)) {
                    this._registerOnChildRemoved();
                    this._registeredNodeEventTypeMask |= REGISTERED_EVENT_MASK_CHILD_REMOVED_CHANGED;
                }
                break;
            case NodeEventType.CHILD_ADDED:
                if (!(this._registeredNodeEventTypeMask & REGISTERED_EVENT_MASK_CHILD_ADDED_CHANGED)) {
                    this._registerOnChildAdded();
                    this._registeredNodeEventTypeMask |= REGISTERED_EVENT_MASK_CHILD_ADDED_CHANGED;
                }
                break;
            case NodeEventType.SIBLING_ORDER_CHANGED:
                if (!(this._registeredNodeEventTypeMask & REGISTERED_EVENT_MASK_SIBLING_ORDER_CHANGED_CHANGED)) {
                    this._registerOnSiblingOrderChanged();
                    this._registeredNodeEventTypeMask |= REGISTERED_EVENT_MASK_SIBLING_ORDER_CHANGED_CHANGED;
                }
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
}
