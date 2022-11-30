import { getClassId } from '../utils/js-typed';
import { IArchive } from './IArchive';
import { ISerializable } from './ISerializable';
import { IObjectFactory } from './ObjectFactory';
import { SerializeData } from './SerializeData';
import { SerializeTag, assert } from './utils';

class DeserializeNode {
    private _data: SerializeData;
    private _offset = 0;
    private _name = '';

    constructor (name: string, arrayBuffer: ArrayBuffer) {
        this._name = name;
        this._data = new SerializeData(arrayBuffer);
    }

    get name () {
        return this._name;
    }

    get data () {
        return this._data;
    }

    get offset () {
        return this._offset;
    }

    set offset (v: number) {
        this._offset = v;
    }

    popDependTargetInfo () {
        // offset, size
        return [this.popInt32(), this.popInt32()];
    }

    popArrayTag (): number {
        assert(this.popInt8() === SerializeTag.TAG_ARRAY);
        return this.popInt32();
    }

    popMapTag () {
        assert(this.popInt8() === SerializeTag.TAG_MAP);
    }

    popBoolean (): boolean {
        const ret = !!this._data.getUint8(this._offset);
        this._offset += 1;
        return ret;
    }

    popInt8 (): number {
        const ret = this._data.getInt8(this._offset);
        this._offset += 1;
        return ret;
    }

    popInt16 (): number {
        const ret = this._data.getInt16(this._offset);
        this._offset += 2;
        return ret;
    }

    popInt32 (): number {
        const ret = this._data.getInt32(this._offset);
        this._offset += 4;
        return ret;
    }

    // popInt64(): BigInt {
    //     const ret = this._data.getBigInt64(this._offset);
    //     this._offset += 8;
    //     return ret;
    // }

    popUint8 (): number {
        const ret = this._data.getUint8(this._offset);
        this._offset += 1;
        return ret;
    }

    popUint16 (): number {
        const ret = this._data.getUint16(this._offset);
        this._offset += 2;
        return ret;
    }

    popUint32 (): number {
        const ret = this._data.getUint32(this._offset);
        this._offset += 4;
        return ret;
    }

    // popUint64(): BigInt {
    //     const ret = this._data.getBigUint64(this._offset);
    //     this._offset += 8;
    //     return ret;
    // }

    popFloat32 (): number {
        const ret = this._data.getFloat32(this._offset);
        this._offset += 4;
        return ret;
    }

    popFloat64 (): number {
        const ret = this._data.getFloat64(this._offset);
        this._offset += 8;
        return ret;
    }

    popString (): string {
        const ret = this._data.getString(this._offset);
        this._offset += (ret.length * 2 + 4); // 4 is how many bytes of string.
        return ret;
    }
}

export class BinaryInputArchive implements IArchive {
    private _currentNode: DeserializeNode;
    private _isRoot = true;
    private _objectFactory: IObjectFactory;
    // offset -> ISerializable
    private _deserializedObjIdMap = new Map<number, ISerializable>();

    constructor (buffer: ArrayBuffer, objectFactory: IObjectFactory) {
        this._currentNode = new DeserializeNode('root', buffer);
        this._objectFactory = objectFactory;
    }

    public start (obj: ISerializable): void {
        this.str(getClassId(obj), '__type__');
        if (obj.serialize) {
            obj.serialize(this);
        }
    }

    public anyValue (data: any, name: string): any {
        return this._serializeInternal(data, name);
    }

    private _serializeInternal (obj: any, name: string): any {
        const currentNode = this._currentNode;
        const tag: number = currentNode.popInt8();
        switch (tag) {
        case SerializeTag.TAG_NULL:
            currentNode.popBoolean();
            currentNode.popInt32();
            currentNode.popInt32();
            return null;
        case SerializeTag.TAG_NUMBER:
            return currentNode.popFloat64();
        case SerializeTag.TAG_STRING:
            return currentNode.popString();
        case SerializeTag.TAG_BOOLEAN:
            return currentNode.popBoolean();
        case SerializeTag.TAG_ARRAY:
            return this.serializeArray(obj, name) as any;
        case SerializeTag.TAG_MAP:
            return this.plainObj(obj, name);
        case SerializeTag.TAG_SERIALIZABLE_OBJECT:
            return this.serializableObj(obj, name);
        default:
            return null;
        }
    }

    boolean (data: boolean, name: string): boolean {
        return this._currentNode.popBoolean();
    }

    int8 (data: number, name: string): number {
        return this._currentNode.popInt8();
    }

    int16 (data: number, name: string): number {
        return this._currentNode.popInt16();
    }

    int32 (data: number, name: string): number {
        return this._currentNode.popInt32();
    }

    serializeInt64 (data: number, name: string): number {
        throw new Error('Method not implemented.');
    }

    uint8 (data: number, name: string): number {
        return this._currentNode.popUint8();
    }

    uint16 (data: number, name: string): number {
        return this._currentNode.popUint16();
    }

    uint32 (data: number, name: string): number {
        return this._currentNode.popUint32();
    }

    serializeUint64 (data: number, name: string): number {
        throw new Error('Method not implemented.');
    }

    float32 (data: number, name: string): number {
        return this._currentNode.popFloat32();
    }

    float64 (data: number, name: string): number {
        return this._currentNode.popFloat64();
    }

    str (data: string, name: string): string {
        return this._currentNode.popString();
    }

    plainObj (data: any, name: string): any {
        this._isRoot = false;

        data = data || {};

        const currentNode = this._currentNode;
        const elementCount = currentNode.popInt32();

        for (let i = 0; i < elementCount; ++i) {
            const key = currentNode.popString();
            const value = this._serializeInternal(null, key);
            data[key] = value;
        }

        return data;
    }

    serializableObj (data: ISerializable | null, name: string): ISerializable | null {
        this._isRoot = false;

        const currentNode = this._currentNode;
        const isInline = currentNode.popBoolean();
        const currentOffset = currentNode.offset;
        let targetOffset = 0;

        if (!isInline) {
            targetOffset = currentNode.popInt32();

            if (targetOffset == -1) {
                // console.log(`return null, currentOffset: ${currentOffset-1}`);
                currentNode.popInt32();
                return null;
            }

            // console.log(`==> Deserialize ISerailizable, currentOffset: ${currentOffset-1}`);

            const cached = this._deserializedObjIdMap.get(targetOffset);
            if (cached) {
                currentNode.popInt32(); // pop targetSize;
                return cached;
            }

            // Reset currentNode to which we index
            currentNode.offset = targetOffset;
        }

        const type = currentNode.popString();

        if (!isInline) {
            currentNode.offset = targetOffset;
        } else {
            currentNode.offset = currentOffset;
        }

        const ret = data || this._objectFactory.createObject(type) as ISerializable;
        assert(ret);

        if (!isInline) {
            this._deserializedObjIdMap.set(targetOffset, ret);
        }

        let serializeMethod;
        const serializeExist = !!ret.serialize;
        const serializeInlineData = !!ret.serializeInlineData;

        if (serializeExist && serializeInlineData) {
            if (this._isRoot) {
                serializeMethod = ret.serialize;
            } else {
                serializeMethod = ret.serializeInlineData;
            }
        } else if (serializeExist) {
            serializeMethod = ret.serialize;
        } else if (serializeInlineData) {
            serializeMethod = ret.serializeInlineData;
        }

        serializeMethod.call(ret, this);

        if (ret.onAfterDeserialize) {
            ret.onAfterDeserialize();
        }

        if (!isInline) {
            currentNode.offset = currentOffset + 8; // 8 is targetOffset + targetSize
        }
        return ret;
    }

    booleanArray (data: boolean[], name: string): boolean[] {
        throw new Error('Method not implemented.');
    }
    int32Array (data: number[], name: string): number[] {
        throw new Error('Method not implemented.');
    }
    // serializeArrayInt64(data: number[], name: string): number[] {
    //     throw new Error("Method not implemented.");
    // }
    float32Array (data: number[], name: string): number[] {
        throw new Error('Method not implemented.');
    }
    float64Array (data: number[], name: string): number[] {
        throw new Error('Method not implemented.');
    }
    strArray (data: string[], name: string): string[] {
        throw new Error('Method not implemented.');
    }
    plainObjArray (data: unknown[], name: string): unknown[] {
        throw new Error('Method not implemented.');
    }

    serializableObjArray (data: (ISerializable | null)[] | null, name: string): (ISerializable | null)[] | null {
        let length = 0;
        const currentNode = this._currentNode;
        const tag = currentNode.popInt8();
        if (tag === SerializeTag.TAG_NULL) {
            //TODO:
            currentNode.popBoolean();
            currentNode.popInt32();
            currentNode.popInt32();
            return null;
        } else if (tag === SerializeTag.TAG_ARRAY) {
            length = currentNode.popInt32();
        } else {
            assert(false);
        }

        let arr: (ISerializable | null)[];
        if (Array.isArray(data)) {
            data.length = length;
            arr = data;
        } else {
            arr = new Array(length);
        }

        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this.serializableObj(arr[i], `${i}`) as ISerializable;
        }

        return arr;
    }

    typedArray (data: any, name: string) {
        throw new Error('Method not implemented.');
    }

    private serializeArray (data: any[], name: string): any[] {
        const length = this._currentNode.popArrayTag();

        let arr: any[];
        if (Array.isArray(data)) {
            data.length = length;
            arr = data;
        } else {
            arr = new Array(length);
        }

        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this._serializeInternal(arr[i], `${i}`);
        }

        return arr;
    }

    isReading (): boolean {
        return true;
    }
    isWritting (): boolean {
        return false;
    }
    isRoot (): boolean {
        return this._isRoot;
    }

    isExporting (): boolean {
        return false;
    }
}
