import { assert, checkISerializableObjectNeedInline, ObjectKindFlag, SerializeTag } from './utils';
import { IArchive } from './IArchive';
import { ISerializable } from './ISerializable';
import { SerializeData } from './SerializeData';
import { getClassId } from '../utils/js-typed';
import { legacyCC } from '../global-exports';

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

    pushObjectFlag (isNull: boolean, isInline: boolean) {
        let flag = 0;
        if (isNull) {
            flag |= ObjectKindFlag.NULL;
        }
        if (isInline) {
            flag |= ObjectKindFlag.INLINE;
        }
        this.pushUint8(flag);
    }

    pushDependTargetInfo () {
        this.pushObjectFlag(false, false); // whether is null and inlined
        this.pushInt32(-1); // padding offset in the entire buffer
        // this.pushInt32(-1); // padding for targetSize, for debug only
    }

    pushArrayTag (length: number) {
        this.pushInt8(SerializeTag.TAG_ARRAY);
        this.pushInt32(length);
    }

    pushBoolean (value: boolean) {
        this._data.setUint8(this._offset, value ? 1 : 0);
        this._offset += 1;
        assert(this._offset === this._data.byteLength);
    }

    pushInt8 (value: number) {
        this._data.setInt8(this._offset, value);
        this._offset += 1;
        assert(this._offset === this._data.byteLength);
    }

    pushInt16 (value: number) {
        this._data.setInt16(this._offset, value);
        this._offset += 2;
        assert(this._offset === this._data.byteLength);
    }

    pushInt32 (value: number) {
        this._data.setInt32(this._offset, value);
        this._offset += 4;
        assert(this._offset === this._data.byteLength);
    }

    // pushInt64(value: number) {
    //     this._data.setBigInt64(this._offset, value);
    //     this._offset += 8;
    // }

    pushUint8 (value: number) {
        this._data.setUint8(this._offset, value);
        this._offset += 1;
        assert(this._offset === this._data.byteLength);
    }

    pushUint16 (value: number) {
        this._data.setUint16(this._offset, value);
        this._offset += 2;
        assert(this._offset === this._data.byteLength);
    }

    pushUint32 (value: number) {
        this._data.setUint32(this._offset, value);
        this._offset += 4;
        assert(this._offset === this._data.byteLength);
    }

    // pushUint64(value: number) {
    //     this._data.setBigUint64(this._offset, value);
    //     this._offset += 8;
    // }

    pushFloat32 (value: number) {
        this._data.setFloat32(this._offset, value);
        this._offset += 4;
        assert(this._offset === this._data.byteLength);
    }

    pushFloat64 (value: number) {
        this._data.setFloat64(this._offset, value);
        this._offset += 8;
        assert(this._offset === this._data.byteLength);
    }

    pushString (value: string) {
        const bytesWritten = this._data.setString(this._offset, value);
        this._offset += bytesWritten;
        assert(this._offset === this._data.byteLength);
    }
}

interface IObjectStackElement {
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
    private _uuidStack: number[] = []; // value is -1 means no uuid dependence
    private _uuidList: string[] = [];
    private _stringListNode: SerializeNode;
    private _stringList: string[] = [];
    private _currentNode: SerializeNode;
    private _serializedList: SerializeNode[] = [];
    private _serializedObjIdMap = new Map<any, IDependTargetInfo>();
    private _objectStack: IObjectStackElement[] = [];
    private _objectDepth = 0;
    private _isRoot = true;
    private _isExporting = false;

    constructor (isExporting = false) {
        this._isExporting = isExporting;
        const uuidListNode = new SerializeNode('uuidList', null);
        uuidListNode.pushUint32(0);
        this._serializedList.push(uuidListNode);

        this._stringListNode = new SerializeNode('stringList', null);
        this._stringListNode.pushUint32(0);
        this._serializedList.push(this._stringListNode);

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

    // public int64(data: number, name: string): number {
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

    // public int64(data: number, name: string): number {
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
        this._pushString(data);
        return data;
    }

    private _pushString (data: string): void {
        // push index
        let index = this._stringList.indexOf(data);
        if (index === -1) {
            index = this._stringList.length;
            this._stringList.push(data);
            this._stringListNode.pushString(data);
        }

        this._currentNode.pushUint32(index); // push index
    }

    public uuid (data: string): string {
        let index = this._uuidList.indexOf(data);
        if (index === -1) {
            index = this._uuidList.length;
            this._uuidList.push(data);
            this._serializedList[0].pushString(data);
        }
        this._uuidStack[this._uuidStack.length - 1] = index;
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
            this._pushString(key);
            this._serializeInternal(value, key);
        }

        return data;
    }

    public serializableObj (data: ISerializable | undefined | null, name: string): ISerializable | undefined | null {
        const isRoot = this._isRoot;
        this._isRoot = false;

        if (data == null) {
            this._pushNull();
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
            // need to push depend target info after ownerInfoList.push
            parentNode.pushDependTargetInfo();
        } else {
            let dependTargetInfo;
            const needInline = checkISerializableObjectNeedInline(data, isRoot);
            if (!needInline) {
                this._currentNode = new SerializeNode(name, parentNode);
                dependTargetInfo = createDependTargetInfo();
                this._serializedObjIdMap.set(data, dependTargetInfo);

                dependTargetInfo.ownerInfoList.push({
                    owner: parentNode,
                    ownerKey: name,
                    ownerOffset: parentNode.offset,
                });
                // need to push depend target info after ownerInfoList.push
                parentNode.pushDependTargetInfo();
                this._currentNode._dependTargetInfoList.push(dependTargetInfo);
            }

            if (this._objectDepth > 0 && !needInline) {
                this._objectStack.push({
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

    // public int64Array(data: number[], name: string): number[] {
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

    public serializableObjArray (data: (ISerializable | null)[] | null | undefined, name: string): (ISerializable | null)[] | null | undefined {
        if (data == null) {
            this._currentNode.pushInt8(SerializeTag.TAG_NULL);
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
            // Write __type__ above all.
            this.str(getClassId(data), '__type__');
            if (data.serialize) {
                data.serialize(this);
                dependTargetInfo.__id__ = this._serializedList.length;
                dependTargetInfo.targetSize = this._currentNode.offset;
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
            const currentUuidIndex = this._uuidStack.length;
            this._uuidStack.push(-1);

            this._currentNode.pushObjectFlag(false, true);// mark data is null or inlined
            const uuidOffsetPos = this._currentNode.offset;
            this._currentNode.pushInt32(-1); // the advance to uuid info, -1 is a placeholder here, it means no uuid.

            // Write __type__ above all.
            this.str(getClassId(data), '__type__');
            data.serializeInlineData(this);

            const uuidIndex = this._uuidStack[currentUuidIndex];
            if (uuidIndex !== -1) {
                this._currentNode.data.setInt32(uuidOffsetPos, this._currentNode.offset - uuidOffsetPos - 4);
                this._currentNode.pushUint32(uuidIndex);
            }
            this._uuidStack.pop();
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

    private _pushNull () {
        this._currentNode.pushObjectFlag(true, false); // whether is null and inlined
    }

    private serializeNumber (data: number, name: string) {
        this._currentNode.pushFloat64(data);
    }

    private serializeArray (data: any[], name: string) {
        for (let i = 0; i < data.length; ++i) {
            this._serializeInternal(data[i], `${i}`);
        }
    }

    dump (): ArrayBuffer {
        //TODO(cjh): add .cccb header info

        // handle uuid list
        const uuidNode = this._serializedList[0];
        uuidNode.data.setUint32(0, this._uuidList.length);

        // handle string list
        this._stringListNode.data.setUint32(0, this._stringList.length);
        //
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
                    //cjh for debug only
                    //  assert(ownerData.getInt32(ownerInfo.ownerOffset + 5) === -1);
                    //
                    const ownerOffsetStartInBinary = ownerInfo.owner.offsetInBinary;
                    const ownerOffsetInBinary = ownerOffsetStartInBinary + ownerInfo.ownerOffset;
                    // eslint-disable-next-line max-len
                    console.log(`Update owner, key: ${ownerInfo.ownerKey}, ownerOffsetInBinary: ${ownerOffsetInBinary}, targetOffset: ${node.offsetInBinary}, targetSize: ${node.offset}`);

                    // Update offset and targetSize which are pushed in pushDependTargetInfo
                    ownerData.setInt32(ownerInfo.ownerOffset + 1, node.offsetInBinary);
                    //cjh for debug only
                    // ownerData.setInt32(ownerInfo.ownerOffset + 5, node.offset);
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

legacyCC.BinaryOutArchive = BinaryOutputArchive;
