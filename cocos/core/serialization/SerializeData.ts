import { assert } from './utils';
import { stringToUTF8Array, UTF8ArrayToString, lengthBytesUTF8 } from './string-utils';

const DEFAULT_ARRAY_BUFFER_SIZE = 1024;

export class SerializeData {
    private _bufferView: Uint8Array;
    private _dataLength = 0;
    private _dataView: DataView;

    constructor (buffer: Uint8Array | null = null) {
        this._bufferView = buffer || new Uint8Array(DEFAULT_ARRAY_BUFFER_SIZE);
        this._dataLength = buffer ? buffer.length : 0;
        this._dataView = new DataView(this._bufferView.buffer, this._bufferView.byteOffset, this._bufferView.byteLength);
    }

    public get bufferView (): Uint8Array {
        return this._bufferView;
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

        if (newDataSize >= this.bufferView.length) {
            const oldUint8Array = this.bufferView;
            // Allocate a new buffer and reset buffer view
            this._bufferView = new Uint8Array(Math.max(newDataSize + DEFAULT_ARRAY_BUFFER_SIZE, this.bufferView.length * 2));
            // Reset dataview
            this._dataView = new DataView(this._bufferView.buffer);
            // Copy data from the old arraybuffer to the new one
            this._bufferView.set(oldUint8Array, 0);
            console.log(`==> expandBuffer from ${oldUint8Array.byteLength} to ${this._bufferView.byteLength}`);
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

    // setString (byteOffset: number, value: string) {
    //     if (byteOffset < 0) {
    //         return;
    //     }

    //     const strBytes = value.length * 2;
    //     this.expandBufferIfNeeded(byteOffset, 4 + strBytes); //TODO: Save UTF16 temporarily, needs to change to save utf-8

    //     this.setUint32(byteOffset, strBytes);
    //     byteOffset += 4;
    //     for (let i = 0, len = value.length; i < len; ++i) {
    //         this.setUint16(byteOffset + i * 2, value.charCodeAt(i));
    //     }
    // }

    setString (byteOffset: number, value: string): number {
        if (byteOffset < 0) {
            return 0;
        }

        const maxBytesToWrite = value.length * 4 + 1;
        this.expandBufferIfNeeded(byteOffset, 4 + maxBytesToWrite);
        const bytesWritten = stringToUTF8Array(value, this._bufferView, byteOffset + 4, maxBytesToWrite);
        this.setUint32(byteOffset, bytesWritten);
        this._dataLength = Math.max(byteOffset + bytesWritten + 4 + 1, this._dataLength);
        return bytesWritten + 4 + 1; // 1 is null-terminated
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

    getUint16 (byteOffset: number): number {
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

    // getString (byteOffset: number) {
    //     if (byteOffset >= 0 && byteOffset + 4 <= this._dataLength) {
    //         const strBytes = this.getUint32(byteOffset);
    //         const strLength = strBytes / 2;

    //         byteOffset += 4;
    //         const dstOffset = byteOffset + strBytes;
    //         if (dstOffset <= this._dataLength) {
    //             let arr: number[] | Uint16Array;

    //             if (byteOffset % 2 === 0) {
    //                 arr = new Uint16Array(this._arrayBuffer, byteOffset, strLength);
    //                 // @ts-expect-error Use String.fromCharCode.apply is faster
    //                 const ret = String.fromCharCode.apply(null, arr);
    //                 return ret;
    //             } else {
    //                 arr = new Array(strLength);
    //                 for (let i = 0; i < strLength; ++i) {
    //                     arr[i] = this.getUint16(byteOffset + i * 2);
    //                 }
    //                 const ret = String.fromCharCode.apply(null, arr);
    //                 return ret;

    //                 // let ret = '';
    //                 // for (let i = 0; i < strLength; ++i) {
    //                 //     ret += String.fromCharCode(this.getUint16(byteOffset + i * 2));
    //                 // }
    //                 // return ret;
    //             }
    //         }
    //         throw new RangeError(`Offset ${dstOffset}  is outside the bounds of the DataView (${this._dataLength})`);
    //     }

    //     throw new RangeError(`Offset ${byteOffset}  is outside the bounds of the DataView (${this._dataLength})`);
    // }

    getString (byteOffset: number, strBytes: number): string {
        if (byteOffset >= 0 && byteOffset <= this._dataLength) {
            const str = UTF8ArrayToString(this._bufferView, byteOffset, strBytes);
            return str;
        }

        throw new RangeError(`Offset ${byteOffset}  is outside the bounds of the DataView (${this._dataLength})`);
    }
}
