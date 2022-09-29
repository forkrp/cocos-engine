import { assert } from './utils';

const DEFAULT_ARRAY_BUFFER_SIZE = 1024;

export class SerializeData {
    private _arrayBuffer: ArrayBuffer;
    private _dataLength = 0;
    private _dataView: DataView;

    constructor (arrayBuffer: ArrayBuffer | null = null) {
        if (!arrayBuffer) {
            this._arrayBuffer = new ArrayBuffer(DEFAULT_ARRAY_BUFFER_SIZE);
        } else {
            this._arrayBuffer = arrayBuffer;
            this._dataLength = this._arrayBuffer.byteLength;
        }

        this._dataView = new DataView(this._arrayBuffer);
    }

    public get buffer () {
        return this._arrayBuffer;
    }

    public get byteLength () {
        return this._dataLength;
    }

    private expandBufferIfNeeded (byteOffset: number, dataSize: number) {
        if (dataSize <= 0) {
            return;
        }

        assert(byteOffset >= 0);
        const newDataSize = byteOffset + dataSize;

        if (newDataSize >= this._arrayBuffer.byteLength) {
            const oldArrayBuffer = this._arrayBuffer;
            const oldUint8Array = new Uint8Array(oldArrayBuffer);
            this._arrayBuffer = new ArrayBuffer(Math.max(newDataSize + DEFAULT_ARRAY_BUFFER_SIZE, this._arrayBuffer.byteLength * 2));
            const newUint8Array = new Uint8Array(this._arrayBuffer);
            newUint8Array.set(oldUint8Array, 0);
            this._dataView = new DataView(this._arrayBuffer);
            console.log(`==> expandBuffer from ${oldUint8Array.byteLength} to ${newUint8Array.byteLength}`);
        }
    }

    setInt8 (byteOffset: number, value: number) {
        if (byteOffset < 0) {
            return;
        }

        this.expandBufferIfNeeded(byteOffset, 1);
        this._dataView.setInt8(byteOffset, value);
        this._dataLength = Math.max(byteOffset + 1, this._dataLength);
    }

    setUint8 (byteOffset: number, value: number) {
        if (byteOffset < 0) {
            return;
        }

        this.expandBufferIfNeeded(byteOffset, 1);
        this._dataView.setUint8(byteOffset, value);
        this._dataLength = Math.max(byteOffset + 1, this._dataLength);
    }

    setInt16 (byteOffset: number, value: number) {
        if (byteOffset < 0) {
            return;
        }

        this.expandBufferIfNeeded(byteOffset, 2);
        this._dataView.setInt16(byteOffset, value, true);
        this._dataLength = Math.max(byteOffset + 2, this._dataLength);
    }

    setUint16 (byteOffset: number, value: number) {
        if (byteOffset < 0) {
            return;
        }
        this.expandBufferIfNeeded(byteOffset, 2);
        this._dataView.setUint16(byteOffset, value, true);
        this._dataLength = Math.max(byteOffset + 2, this._dataLength);
    }

    setInt32 (byteOffset: number, value: number) {
        if (byteOffset < 0) {
            return;
        }

        this.expandBufferIfNeeded(byteOffset, 4);
        this._dataView.setInt32(byteOffset, value, true);
        this._dataLength = Math.max(byteOffset + 4, this._dataLength);
    }

    setUint32 (byteOffset: number, value: number) {
        if (byteOffset < 0) {
            return;
        }

        this.expandBufferIfNeeded(byteOffset, 4);
        this._dataView.setUint32(byteOffset, value, true);
        this._dataLength = Math.max(byteOffset + 4, this._dataLength);
    }

    setFloat32 (byteOffset: number, value: number) {
        if (byteOffset < 0) {
            return;
        }

        this.expandBufferIfNeeded(byteOffset, 4);
        this._dataView.setFloat32(byteOffset, value, true);
        this._dataLength = Math.max(byteOffset + 4, this._dataLength);
    }

    setFloat64 (byteOffset: number, value: number) {
        if (byteOffset < 0) {
            return;
        }

        this.expandBufferIfNeeded(byteOffset, 8);
        this._dataView.setFloat64(byteOffset, value, true);
        this._dataLength = Math.max(byteOffset + 8, this._dataLength);
    }

    // setBigInt64(byteOffset: number, value: number) {
    //     if (byteOffset < 0) {
    //         return;
    //     }

    //     this.expandBufferIfNeeded(byteOffset, 8);
    //     this._dataView.setBigInt64(byteOffset, value, true);
    //     this._dataLength = Math.max(byteOffset + 8, this._dataLength);
    // }

    // setBigUint64(byteOffset: number, value: number) {
    //     if (byteOffset < 0) {
    //         return;
    //     }

    //     this.expandBufferIfNeeded(byteOffset, 8);
    //     this._dataView.setBigUint64(byteOffset, value, true);
    //     this._dataLength = Math.max(byteOffset + 8, this._dataLength);
    // }

    setString (byteOffset: number, value: string) {
        if (byteOffset < 0) {
            return;
        }

        const strBytes = value.length * 2;
        this.expandBufferIfNeeded(byteOffset, 4 + strBytes); //TODO: Save UTF16 temporarily, needs to change to save utf-8

        this.setUint32(byteOffset, strBytes);
        byteOffset += 4;
        for (let i = 0, len = value.length; i < len; ++i) {
            this.setUint16(byteOffset + i * 2, value.charCodeAt(i));
        }
    }

    // get

    getInt8 (byteOffset: number) {
        if (byteOffset >= 0 && byteOffset + 1 <= this._dataLength) {
            return this._dataView.getInt8(byteOffset);
        }

        throw new RangeError(`Offset ${byteOffset} is outside the bounds of the DataView (${this._dataLength})`);
    }

    getUint8 (byteOffset: number) {
        if (byteOffset >= 0 && byteOffset + 1 <= this._dataLength) {
            return this._dataView.getUint8(byteOffset);
        }

        throw new RangeError(`Offset ${byteOffset} is outside the bounds of the DataView (${this._dataLength})`);
    }

    getInt16 (byteOffset: number) {
        if (byteOffset >= 0 && byteOffset + 2 <= this._dataLength) {
            return this._dataView.getInt16(byteOffset, true);
        }

        throw new RangeError(`Offset ${byteOffset} is outside the bounds of the DataView (${this._dataLength})`);
    }

    getUint16 (byteOffset: number) : number {
        if (byteOffset >= 0 && byteOffset + 2 <= this._dataLength) {
            return this._dataView.getUint16(byteOffset, true);
        }

        throw new RangeError(`Offset ${byteOffset} is outside the bounds of the DataView (${this._dataLength})`);
    }

    getInt32 (byteOffset: number) {
        if (byteOffset >= 0 && byteOffset + 4 <= this._dataLength) {
            return this._dataView.getInt32(byteOffset, true);
        }

        throw new RangeError(`Offset ${byteOffset} is outside the bounds of the DataView (${this._dataLength})`);
    }

    getUint32 (byteOffset: number) {
        if (byteOffset >= 0 && byteOffset + 4 <= this._dataLength) {
            return this._dataView.getUint32(byteOffset, true);
        }

        throw new RangeError(`Offset ${byteOffset} is outside the bounds of the DataView (${this._dataLength})`);
    }

    getFloat32 (byteOffset: number) {
        if (byteOffset >= 0 && byteOffset + 4 <= this._dataLength) {
            return this._dataView.getFloat32(byteOffset, true);
        }

        throw new RangeError(`Offset ${byteOffset} is outside the bounds of the DataView (${this._dataLength})`);
    }

    getFloat64 (byteOffset: number) {
        if (byteOffset >= 0 && byteOffset + 8 <= this._dataLength) {
            return this._dataView.getFloat64(byteOffset, true);
        }

        throw new RangeError(`Offset ${byteOffset} is outside the bounds of the DataView (${this._dataLength})`);
    }

    // getBigInt64(byteOffset: number) {
    //     if (byteOffset >= 0 && byteOffset + 8 <= this._dataLength) {
    //         return this._dataView.getBigInt64(byteOffset, true);
    //     }

    //     throw new RangeError(`Offset ${byteOffset} is outside the bounds of the DataView (${this._dataLength})`);
    // }

    // getBigUint64(byteOffset: number) {
    //     if (byteOffset >= 0 && byteOffset + 8 <= this._dataLength) {
    //         return this._dataView.getBigUint64(byteOffset, true);
    //     }

    //     throw new RangeError(`Offset ${byteOffset} is outside the bounds of the DataView (${this._dataLength})`);
    // }

    getString (byteOffset: number) {
        if (byteOffset >= 0 && byteOffset + 4 <= this._dataLength) {
            const strBytes = this.getUint32(byteOffset);
            const strLength = strBytes / 2;

            byteOffset += 4;
            const dstOffset = byteOffset + strBytes;
            if (dstOffset <= this._dataLength) {
                let arr: number[] | Uint16Array;

                if (byteOffset % 2 === 0) {
                    arr = new Uint16Array(this._arrayBuffer, byteOffset, strLength);
                    // @ts-expect-error
                    const ret = String.fromCharCode.apply(null, arr);
                    return ret;
                } else {
                    arr = new Array(strLength);
                    for (let i = 0; i < strLength; ++i) {
                        arr[i] = this.getUint16(byteOffset + i * 2);
                    }
                    const ret = String.fromCharCode.apply(null, arr);
                    return ret;

                    // let ret = '';
                    // for (let i = 0; i < strLength; ++i) {
                    //     ret += String.fromCharCode(this.getUint16(byteOffset + i * 2));
                    // }
                    // return ret;
                }
            }
            throw new RangeError(`Offset ${dstOffset}  is outside the bounds of the DataView (${this._dataLength})`);
        }

        throw new RangeError(`Offset ${byteOffset}  is outside the bounds of the DataView (${this._dataLength})`);
    }
}
