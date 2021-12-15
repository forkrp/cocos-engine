export class CommandQueue {
    private _queueSizeInBytes: number = 1024 * 1024; // Default 1MB
    private _commandQueueArrayBuffer: ArrayBuffer;
    private _commandQueueIndex: number = 0;
    private _dataView: DataView;
    private _byteOffset: number = 0;
    private _flushDepth: number = 0;
    private _flushCallback: (queueIndex: number, commandBytes: number) => void;

    constructor(queueIndex: number, flushCallback: (queueIndex: number, commandBytes: number) => void, queueSizeInBytes?: number) {
        this._flushCallback = flushCallback;
        if (queueSizeInBytes) {
            this._queueSizeInBytes = queueSizeInBytes;
        }
        this._commandQueueArrayBuffer = new ArrayBuffer(this._queueSizeInBytes);
        this._dataView = new DataView(this._commandQueueArrayBuffer);
        this._commandQueueIndex = queueIndex;
    }

    public get buffer () {
        return this._commandQueueArrayBuffer;
    }

    public get length () {
        return this._byteOffset;
    }

    public isEmpty() {
        return this._byteOffset === 0;
    }

    public ensureEnoughSpace(bytesNeeds: number) {
        if (this._byteOffset + bytesNeeds > this._queueSizeInBytes) {
            this.flush();
        }
    }

    public pushBool(v: boolean) {
        this._dataView.setUint8(this._byteOffset, v ? 1 : 0);
        this._byteOffset += 1;
    }

    public pushUint8 (v: number) {
        this._dataView.setUint8(this._byteOffset, v);
        this._byteOffset += 1;
    }

    public pushUint32 (v : number) {
        this._dataView.setUint32(this._byteOffset, v, true);
        this._byteOffset += 4;
    }

    public pushInt32 (v: number) {
        this._dataView.setInt32(this._byteOffset, v, true);
        this._byteOffset += 4;
    }

    public pushFloat32 (v: number) {
        this._dataView.setFloat32(this._byteOffset, v, true);
        this._byteOffset += 4;
    }

    public pushBigUint64 (v: number) {
        // @ts-ignore
        this._dataView.setBigUint64(this._byteOffset, v, true);
        this._byteOffset += 8;
    }

    public flush () {
        ++this._flushDepth;
        if (this._flushDepth === 1) {
            if (this._byteOffset > 0) {
                this._flushCallback(this._commandQueueIndex, this._byteOffset);
                this._byteOffset = 0;
            }
        }
        --this._flushDepth;
    }

    public commit () {
        // this.flush();
    }
}

export class CommandQueueManager {
    private _queues: CommandQueue[];
    private _curQueueIndex: number = 0;

    constructor(flushCallback: (queueIndex: number, commandBytes: number) => void, queueSizeInBytes?: number) {
        this._queues = [
            new CommandQueue(0, flushCallback, queueSizeInBytes),
            new CommandQueue(1, flushCallback, queueSizeInBytes)
        ];
    }

    public get queues () {
        return this._queues;
    }

    public getCommandQueue() : CommandQueue {
        return this._queues[this._curQueueIndex];
    }

    private flushInternal () {
        const curQueueIndex = this._curQueueIndex;
        this.swap();
        const nextQueueIndex = this._curQueueIndex;
        this._queues[curQueueIndex].flush();

        if (!this._queues[nextQueueIndex].isEmpty()) {
            this.flushInternal();
        }
    }

    public flush () {
        this.flushInternal();
        if (!this.isEmpty()) {
            throw new Error(`Queues isn't empty after flush`);
        }
    }

    public isEmpty() : boolean {
        return this._queues[0].isEmpty() && this._queues[1].isEmpty();
    }

    public get length() : number {
        return this._queues[0].length + this._queues[1].length;
    }

    private swap () {
        this._curQueueIndex = (this._curQueueIndex + 1) % 2;
    }
}
