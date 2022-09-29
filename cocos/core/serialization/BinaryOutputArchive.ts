import { assert, checkISerializableObjectNeedInline, SerializeTag } from './utils';
import { IArchive } from './IArchive';
import { ISerializable } from './ISerializable';
import { SerializeData } from './SerializeData';
import { getClassId } from '../utils/js-typed';

interface IDependOwnerInfo {
    owner: SerializeNode,
    ownerKey: string, // For debug only
    ownerOffset: number
}
interface IDependTargetInfo {
    __id__: number,
    targetSize: number,
    ownerInfoList: IDependOwnerInfo[]
}

class SerializeNode {
    private _data: SerializeData = new SerializeData();
    private _offset = 0;
    private _name = '';
    public _dependTargetInfoList: IDependTargetInfo[] = [];
    public __index__ = -1;
    public offsetInBinary = 0;
    public _parentNode: SerializeNode | null = null;

    constructor (name: string, parentNode: SerializeNode | null) {
        this._name = name;
        this._parentNode = parentNode;
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

    pushDependTargetInfo () {
        this.pushBoolean(false); // whether is inline data
        this.pushInt32(-1); // padding offset in the entire buffer
        this.pushInt32(-1); // padding for targetSize
    }

    pushArrayTag (length: number) {
        this.pushInt8(SerializeTag.TAG_ARRAY);
        this.pushInt32(length);
    }

    pushBoolean (value: boolean) {
        this._data.setUint8(this._offset, value ? 1 : 0);
        this._offset += 1;
    }

    pushInt8 (value: number) {
        this._data.setInt8(this._offset, value);
        this._offset += 1;
    }

    pushInt16 (value: number) {
        this._data.setInt16(this._offset, value);
        this._offset += 2;
    }

    pushInt32 (value: number) {
        this._data.setInt32(this._offset, value);
        this._offset += 4;
    }

    // pushInt64(value: number) {
    //     this._data.setBigInt64(this._offset, value);
    //     this._offset += 8;
    // }

    pushUint8 (value: number) {
        this._data.setUint8(this._offset, value);
        this._offset += 1;
    }

    pushUint16 (value: number) {
        this._data.setUint16(this._offset, value);
        this._offset += 2;
    }

    pushUint32 (value: number) {
        this._data.setUint32(this._offset, value);
        this._offset += 4;
    }

    // pushUint64(value: number) {
    //     this._data.setBigUint64(this._offset, value);
    //     this._offset += 8;
    // }

    pushFloat32 (value: number) {
        this._data.setFloat32(this._offset, value);
        this._offset += 4;
    }

    pushFloat64 (value: number) {
        this._data.setFloat64(this._offset, value);
        this._offset += 8;
    }

    pushString (value: string) {
        this._data.setString(this._offset, value);
        this._offset += (value.length * 2 + 4); // 4 is how many bytes of string.
    }
}

interface IObjectStackElement {
    __index__: number,
    parentNode: SerializeNode,
    serializedNode: SerializeNode,
    data: ISerializable,
    key: string,
    needInline: boolean,
    dependTargetInfo: IDependTargetInfo
}

function createDependTargetInfo (): IDependTargetInfo {
    return {
        __id__: -1,
        targetSize: -1,
        ownerInfoList: [],
    };
}

export class BinaryOutputArchive implements IArchive {
    private _currentNode: SerializeNode;
    private _serializedList: SerializeNode[] = [];
    private _serializedObjIdMap = new Map<any, IDependTargetInfo>();
    private _objectStack: IObjectStackElement[] = [];
    private _objectDepth = 0;
    private _isRoot = true;
    private _isExporting = false;

    constructor (isExporting = false) {
        this._isExporting = isExporting;
        this._currentNode = new SerializeNode('root', null);
        this._serializedList.push(this._currentNode);
    }

    public isRoot (): boolean {
        return this._isRoot;
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

    public boolean (data: boolean, name: string): boolean {
        this._currentNode.pushBoolean(data);
        return data;
    }

    public int8 (data: number, name: string): number {
        this._currentNode.pushInt8(data);
        return data;
    }

    public int16 (data: number, name: string): number {
        this._currentNode.pushInt16(data);
        return data;
    }

    public int32 (data: number, name: string): number {
        this._currentNode.pushInt32(data);
        return data;
    }

    // public serializeInt64(data: number, name: string): number {
    //     this._currentNode.pushInt64(data);
    //     return data;
    // }

    public uint8 (data: number, name: string): number {
        this._currentNode.pushUint8(data);
        return data;
    }

    public uint16 (data: number, name: string): number {
        this._currentNode.pushUint16(data);
        return data;
    }

    public uint32 (data: number, name: string): number {
        this._currentNode.pushUint32(data);
        return data;
    }

    // public serializeUint64(data: number, name: string): number {
    //     this._currentNode.pushUint64(data);
    //     return data;
    // }

    public float32 (data: number, name: string): number {
        this._currentNode.pushFloat32(data);
        return data;
    }

    public float64 (data: number, name: string): number {
        this._currentNode.pushFloat64(data);
        return data;
    }

    public str (data: string, name: string): string {
        this._currentNode.pushString(data);
        return data;
    }

    private getObjectElementCount (obj: any) {
        let count = 0;
        for (const key in obj) {
            // eslint-disable-next-line no-prototype-builtins
            if (!obj.hasOwnProperty(key)) {
                continue;
            }
            ++count;
        }
        return count;
    }

    public plainObj (data: any, name: string): any {
        this._currentNode.pushInt32(this.getObjectElementCount(data));

        for (const key in data) {
            // eslint-disable-next-line no-prototype-builtins
            if (!data.hasOwnProperty(key)) {
                continue;
            }

            const value = data[key];
            this._currentNode.pushString(key);
            this._serializeInternal(value, key);
        }

        return data;
    }

    public serializableObj (data: ISerializable | null, name: string): ISerializable | null {
        if (data == null) {
            this._currentNode.pushDependTargetInfo();
            return data;
        }

        const parentNode = this._currentNode;

        const isSerialized = this._serializedObjIdMap.has(data);
        if (isSerialized) {
            const cachedTargetInfo = this._serializedObjIdMap.get(data) as IDependTargetInfo;
            cachedTargetInfo.ownerInfoList.push({
                owner: parentNode,
                ownerKey: name,
                ownerOffset: parentNode.offset,
            });
            parentNode.pushDependTargetInfo();
        } else {
            let dependTargetInfo;
            const needInline = checkISerializableObjectNeedInline(data, this._isRoot);
            if (!needInline) {
                this._currentNode = new SerializeNode(name, parentNode);
                dependTargetInfo = createDependTargetInfo();
                this._serializedObjIdMap.set(data, dependTargetInfo);

                dependTargetInfo.ownerInfoList.push({
                    owner: parentNode,
                    ownerKey: name,
                    ownerOffset: parentNode.offset,
                });
                parentNode.pushDependTargetInfo();
                this._currentNode._dependTargetInfoList.push(dependTargetInfo);
            }

            if (this._objectDepth > 0 && !needInline) {
                this._objectStack.push({
                    __index__: -1,
                    parentNode,
                    serializedNode: this._currentNode,
                    data,
                    key: name,
                    needInline,
                    dependTargetInfo,
                });
            } else {
                this.doSerializeISerializableObject(parentNode, this._currentNode, data, name, needInline, dependTargetInfo);
            }
        }

        this._currentNode = parentNode;
        return data;
    }

    public booleanArray (data: boolean[], name: string): boolean[] {
        this._currentNode.pushArrayTag(data.length);
        for (let i = 0; i < data.length; ++i) {
            this.boolean(data[i], `${i}`);
        }
        return data;
    }

    public int32Array (data: number[], name: string): number[] {
        this._currentNode.pushArrayTag(data.length);
        for (let i = 0; i < data.length; ++i) {
            this.int32(data[i], `${i}`);
        }
        return data;
    }

    // public serializeArrayInt64(data: number[], name: string): number[] {
    //     this._currentNode.pushArrayTag(data.length);
    //     for (let i = 0; i < data.length; ++i) {
    //         this.serializeInt64(data[i], `${i}`);
    //     }
    //     return data;
    // }

    public float32Array (data: number[], name: string): number[] {
        this._currentNode.pushArrayTag(data.length);
        for (let i = 0; i < data.length; ++i) {
            this.float32(data[i], `${i}`);
        }

        return data;
    }

    public float64Array (data: number[], name: string): number[] {
        this._currentNode.pushArrayTag(data.length);
        for (let i = 0; i < data.length; ++i) {
            this.float64(data[i], `${i}`);
        }
        return data;
    }

    public strArray (data: string[], name: string): string[] {
        this._currentNode.pushArrayTag(data.length);
        for (let i = 0; i < data.length; ++i) {
            this.str(data[i], `${i}`);
        }
        return data;
    }

    public plainObjArray (data: any[], name: string): any[] {
        this._currentNode.pushArrayTag(data.length);
        for (let i = 0; i < data.length; ++i) {
            this.plainObj(data[i], `${i}`);
        }
        return data;
    }

    public serializableObjArray (data: (ISerializable | null)[] | null, name: string): (ISerializable | null)[] | null {
        if (data == null) {
            this._currentNode.pushInt8(SerializeTag.TAG_NULL);
            this.serializeNull(name);
            return data;
        }

        this._currentNode.pushArrayTag(data.length);

        for (let i = 0; i < data.length; ++i) {
            this.serializableObj(data[i], `${i}`);
        }
        return data;
    }

    public typedArray (data: any, name: string): any {
        throw new Error(`Not implemented yet`);
    }

    private _serializeInternal (data: any, name: string): any {
        if (data == null) {
            this._currentNode.pushInt8(SerializeTag.TAG_NULL);
            this.serializeNull(name);
        } else if (typeof data === 'number') {
            this._currentNode.pushInt8(SerializeTag.TAG_NUMBER);
            this.serializeNumber(data, name);
        } else if (typeof data === 'string') {
            this._currentNode.pushInt8(SerializeTag.TAG_STRING);
            this.str(data, name);
        } else if (typeof data === 'boolean') {
            this._currentNode.pushInt8(SerializeTag.TAG_BOOLEAN);
            this.boolean(data, name);
        } else if (data instanceof Array) {
            this._currentNode.pushInt8(SerializeTag.TAG_ARRAY);
            this._currentNode.pushInt32(data.length);
            this.serializeArray(data, name);
        } else if (data.serialize) {
            this._isRoot = false;
            this._currentNode.pushInt8(SerializeTag.TAG_SERIALIZABLE_OBJECT);
            this.serializableObj(data, name);
        } else if (data instanceof Object) {
            this._isRoot = false;
            this._currentNode.pushInt8(SerializeTag.TAG_MAP);
            this.plainObj(data, name);
        }

        return data;
    }

    private doSerializeISerializableObject (parentNode: SerializeNode, serializedNode: SerializeNode,
        data: ISerializable, name: string, needInline: boolean, dependTargetInfo: IDependTargetInfo): void {
        ++this._objectDepth;

        const oldCurrentNode = this._currentNode;
        this._currentNode = serializedNode;

        if (data.onBeforeSerialize) {
            data.onBeforeSerialize();
        }

        if (!needInline) {
            assert(this._currentNode.offset === 0);
            if (data.serialize) {
                data.serialize(this);
                dependTargetInfo.__id__ = this._serializedList.length;
                dependTargetInfo.targetSize = this._currentNode.offset;
                serializedNode.__index__ = dependTargetInfo.__id__; // For debug only, need to be deleted.
                this._serializedList.push(serializedNode);
            }
        } else if (data.serializeInlineData) {
            // let totalOffset = 0;
            // let parent = this._currentNode._parentNode;
            // while (parent != null) {
            //     totalOffset += parent.offset;
            //     parent = parent._parentNode;
            // }
            // totalOffset += this._currentNode.offset;
            // console.log(`write inline data: ${totalOffset}`);
            this._currentNode.pushBoolean(true);
            data.serializeInlineData(this);
        }

        this._currentNode = oldCurrentNode;

        --this._objectDepth;

        if (this._objectDepth === 0) {
            const currentStack = this._objectStack;
            this._objectStack = [];
            if (currentStack.length > 0) {
                for (const e of currentStack) {
                    this.doSerializeISerializableObject(
                        e.parentNode,
                        e.serializedNode,
                        e.data,
                        e.key,
                        e.needInline,
                        e.dependTargetInfo,
                    );
                }

                currentStack.length = 0;
            }
        }
    }

    private serializeNull (name: string) {
        this._currentNode.pushDependTargetInfo();
    }

    private serializeNumber (data: number, name: string) {
        this._currentNode.pushFloat64(data);
    }

    private serializeArray (data: any[], name: string) {
        for (let i = 0; i < data.length; ++i) {
            this._serializeInternal(data[i], `${i}`);
        }
    }

    dump () {
        let totalBytes = 0;
        this._serializedList.forEach((e: SerializeNode, index: number) => {
            assert(e.offset === e.data.byteLength);
            totalBytes += e.offset;
        });

        let currentOffset = 0;
        this._serializedList.forEach((e: SerializeNode) => {
            e.offsetInBinary = currentOffset;
            currentOffset += e.data.byteLength;
        });

        this._serializedList.forEach((node: SerializeNode) => {
            for (const depend of node._dependTargetInfoList) {
                for (const ownerInfo of depend.ownerInfoList) {
                    const ownerData = ownerInfo.owner.data;
                    assert(ownerData.getInt32(ownerInfo.ownerOffset + 1) === -1);
                    assert(ownerData.getInt32(ownerInfo.ownerOffset + 5) === -1);
                    const ownerOffsetStartInBinary = ownerInfo.owner.offsetInBinary;
                    const ownerOffsetInBinary = ownerOffsetStartInBinary + ownerInfo.ownerOffset;
                    // eslint-disable-next-line max-len
                    // console.log(`Update owner, key: ${ownerInfo.ownerKey}, ownerOffsetInBinary: ${ownerOffsetInBinary}, targetOffset: ${node.offsetInBinary}, targetSize: ${node.offset}`);
                    ownerData.setInt32(ownerInfo.ownerOffset + 1, node.offsetInBinary);
                    ownerData.setInt32(ownerInfo.ownerOffset + 5, node.offset);
                }
            }
        });

        currentOffset = 0;
        const buffer = new ArrayBuffer(totalBytes);
        const view = new Uint8Array(buffer);

        this._serializedList.forEach((e: SerializeNode) => {
            view.set(new Uint8Array(e.data.buffer, 0, e.data.byteLength), currentOffset);
            currentOffset += e.data.byteLength;
        });

        return buffer;
    }

    isReading (): boolean {
        return false;
    }
    isWritting (): boolean {
        return true;
    }

    isExporting (): boolean {
        return this._isExporting;
    }
}
