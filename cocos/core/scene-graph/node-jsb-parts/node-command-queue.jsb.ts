import {Pool} from "../../memop";

export class CommandQueue {
    private _commandQueueArrayBuffer: ArrayBuffer;
    private _dataView: DataView;
    private _queueSizeInBytes: number = 0;
    private _byteOffset: number = 0;
    private _flushDepth: number = 0;
    private _flushCallback: ((buffer: ArrayBuffer) => void) | null = null;

    constructor(queueSizeInBytes, flushCallback: (buffer: ArrayBuffer) => void) {
        this._queueSizeInBytes = queueSizeInBytes;
        this._commandQueueArrayBuffer = new ArrayBuffer(queueSizeInBytes);
        this._dataView = new DataView(this._commandQueueArrayBuffer);
        this._dataView.setUint32(0, 4, true); // Store used size in the first 4 bytes.
        this._byteOffset = 4;
        this._flushCallback = flushCallback;
    }

    public get buffer () {
        return this._commandQueueArrayBuffer;
    }

    public get length () {
        return this._byteOffset;
    }

    public isEmpty() {
        return this._byteOffset <= 4;
    }

    public ensureEnoughSpace(bytesNeeds: number) {
        if (this._byteOffset + bytesNeeds > this._queueSizeInBytes) {
            this.flush();
        }
    }

    public pushBool(v: boolean) {
        this._dataView.setUint8(this._byteOffset, v ? 1 : 0);
        this._byteOffset += 1;
        this._dataView.setUint32(0, this._byteOffset, true);
    }

    public pushUint8 (v: number) {
        this._dataView.setUint8(this._byteOffset, v);
        this._byteOffset += 1;
        this._dataView.setUint32(0, this._byteOffset, true);
    }

    public pushUint32 (v : number) {
        this._dataView.setUint32(this._byteOffset, v, true);
        this._byteOffset += 4;
        this._dataView.setUint32(0, this._byteOffset, true);
    }

    public pushInt32 (v: number) {
        this._dataView.setInt32(this._byteOffset, v, true);
        this._byteOffset += 4;
        this._dataView.setUint32(0, this._byteOffset, true);
    }

    public pushFloat32 (v: number) {
        this._dataView.setFloat32(this._byteOffset, v, true);
        this._byteOffset += 4;
        this._dataView.setUint32(0, this._byteOffset, true);
    }

    public pushBigUint64 (v: number) {
        // @ts-ignore
        this._dataView.setBigUint64(this._byteOffset, v, true);
        this._byteOffset += 8;
        this._dataView.setUint32(0, this._byteOffset, true);
    }

    public flush () {
        ++this._flushDepth;
        if (this._flushDepth === 1) {
            if (this._byteOffset > 4) {
                if (this._flushCallback) {
                    this._flushCallback(this._commandQueueArrayBuffer);
                }
                this._byteOffset = 4;
                this._dataView.setUint32(0, 4, true);
            }
        } else {
            throw new Error(`Should not happen`);
        }
        --this._flushDepth;
    }

    public commit () {
        // this.flush();
    }
}

export class CommandQueueManager {
    private readonly _queues: Pool<CommandQueue>;
    private _curQueue: CommandQueue;
    private _genNextQueueCallback: (buffer: ArrayBuffer) => void;

    constructor(
        flushCallback: (buffer: ArrayBuffer) => void,
        genNextQueueCallback: (buffer: ArrayBuffer) => void,
        queueSizeInBytes?: number
    ) {
        this._queues = new Pool<CommandQueue>(
            () => new CommandQueue(queueSizeInBytes, flushCallback),
            5
        );
        this._curQueue = this._queues.alloc();
        this._genNextQueueCallback = genNextQueueCallback;
    }

    public getCommandQueue() : CommandQueue {
        return this._curQueue;
    }

    public flush () {
        const curQueue = this._curQueue;
        if (curQueue.isEmpty()) {
            return;
        }
        const nextQueue = this._queues.alloc();
        this._curQueue = nextQueue;
        this._genNextQueueCallback(nextQueue.buffer);
        curQueue.flush();
        this._queues.free(nextQueue);
        this._curQueue = curQueue;
    }
}
