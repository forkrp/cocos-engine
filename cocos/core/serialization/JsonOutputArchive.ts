import { getClassId } from '../utils/js-typed';
import { IArchive } from './IArchive';
import { ISerializable } from './ISerializable';
import { checkISerializableObjectNeedInline } from './utils';

interface IObjectId {
    __id__: number
}

interface IObjectStackElement {
    parentNode: unknown,
    serializedNode: unknown,
    data: ISerializable,
    key: string,
    objId: IObjectId,
    inlineData: boolean
}

export class JsonOutputArchive implements IArchive {
    private _currentNode : any;
    private _serializedList : any[] = [];
    private _serializedObjIdMap = new Map<unknown, IObjectId>();
    private _objectStack : IObjectStackElement[] = [];
    private _objectDepth = 0;
    private _isRoot = true;
    private _isExporting = false;

    constructor (isExporting = false) {
        this._isExporting = isExporting;
        this._currentNode = {};
        this._serializedList.push(this._currentNode);
    }

    public isRoot () : boolean {
        return this._isRoot;
    }

    public start (obj: ISerializable): void {
        this.str(getClassId(obj), '__type__');
        if (obj.serialize) {
            obj.serialize(this);
        }
    }

    public anyValue (data: any, name: string) : any {
        return this._serializeInternal(data, name);
    }

    public boolean (data: boolean, name: string) : boolean {
        this._currentNode[name] = data;
        return data;
    }

    public int8 (data: number, name: string) : number {
        this._currentNode[name] = data;
        return data;
    }

    public int16 (data: number, name: string) : number {
        this._currentNode[name] = data;
        return data;
    }

    public int32 (data: number, name: string) : number {
        this._currentNode[name] = data;
        return data;
    }

    public serializeInt64 (data: number, name: string) : number {
        this._currentNode[name] = data;
        return data;
    }

    public uint8 (data: number, name: string) : number {
        this._currentNode[name] = data;
        return data;
    }

    public uint16 (data: number, name: string) : number {
        this._currentNode[name] = data;
        return data;
    }

    public uint32 (data: number, name: string) : number {
        this._currentNode[name] = data;
        return data;
    }

    public serializeUint64 (data: number, name: string) : number {
        this._currentNode[name] = data;
        return data;
    }

    public float32 (data: number, name: string) : number {
        this._currentNode[name] = data;
        return data;
    }

    public float64 (data: number, name: string) : number {
        this._currentNode[name] = data;
        return data;
    }

    public str (data: string, name: string) : string {
        this._currentNode[name] = data;
        return data;
    }

    public plainObj (data: any, name: string) : any {
        const parentNode = this._currentNode;

        this._currentNode = {};

        for (const key in data) {
            const value = data[key];
            this._serializeInternal(value, key);
        }

        parentNode[name] = this._currentNode;

        this._currentNode = parentNode;
        return data;
    }

    public serializableObj (data: ISerializable | null, name: string) : ISerializable | null {
        if (data == null) {
            this._currentNode[name] = null;
            return data;
        }

        const parentNode = this._currentNode;

        const isSerialized = this._serializedObjIdMap.has(data);
        if (isSerialized) {
            parentNode[name] = this._serializedObjIdMap.get(data);
        } else {
            this._currentNode = {};
            const objId: IObjectId = { __id__: -1 };
            const inlineData = checkISerializableObjectNeedInline(data, this._isRoot);
            if (!inlineData) {
                parentNode[name] = objId;
                this._serializedObjIdMap.set(data, objId);
            } else {
                parentNode[name] = this._currentNode;
            }

            if (this._objectDepth > 0 && !inlineData) {
                this._objectStack.push({
                    parentNode,
                    serializedNode: this._currentNode,
                    data,
                    key: name,
                    objId,
                    inlineData,
                });
            } else {
                this.doSerializeISerializableObject(parentNode, this._currentNode, data, name, objId, inlineData);
            }
        }

        this._currentNode = parentNode;
        return data;
    }

    public booleanArray (data: boolean[], name: string) : boolean[] {
        const parentNode = this._currentNode;
        this._currentNode = new Array(data.length);

        for (let i = 0; i < data.length; ++i) {
            this.boolean(data[i], `${i}`);
        }

        parentNode[name] = this._currentNode;

        this._currentNode = parentNode;
        return data;
    }

    public int32Array (data: number[], name: string) : number[] {
        const parentNode = this._currentNode;
        this._currentNode = new Array(data.length);

        for (let i = 0; i < data.length; ++i) {
            this.int32(data[i], `${i}`);
        }

        parentNode[name] = this._currentNode;

        this._currentNode = parentNode;
        return data;
    }

    public serializeArrayInt64 (data: number[], name: string) : number[] {
        const parentNode = this._currentNode;
        this._currentNode = new Array(data.length);

        for (let i = 0; i < data.length; ++i) {
            this.serializeInt64(data[i], `${i}`);
        }

        parentNode[name] = this._currentNode;

        this._currentNode = parentNode;
        return data;
    }

    public float32Array (data: number[], name: string) : number[] {
        const parentNode = this._currentNode;
        this._currentNode = new Array(data.length);

        for (let i = 0; i < data.length; ++i) {
            this.float32(data[i], `${i}`);
        }

        parentNode[name] = this._currentNode;

        this._currentNode = parentNode;
        return data;
    }

    public float64Array (data: number[], name: string) : number[] {
        const parentNode = this._currentNode;
        this._currentNode = new Array(data.length);

        for (let i = 0; i < data.length; ++i) {
            this.float64(data[i], `${i}`);
        }

        parentNode[name] = this._currentNode;

        this._currentNode = parentNode;
        return data;
    }

    public strArray (data: string[], name: string) : string[] {
        const parentNode = this._currentNode;
        this._currentNode = new Array(data.length);

        for (let i = 0; i < data.length; ++i) {
            this.str(data[i], `${i}`);
        }

        parentNode[name] = this._currentNode;

        this._currentNode = parentNode;
        return data;
    }

    public plainObjArray (data: any[], name: string) : any[] {
        const parentNode = this._currentNode;
        this._currentNode = new Array(data.length);

        for (let i = 0; i < data.length; ++i) {
            this.plainObj(data[i], `${i}`);
        }

        parentNode[name] = this._currentNode;

        this._currentNode = parentNode;
        return data;
    }

    public serializableObjArray (data: (ISerializable | null)[] | null, name: string) : (ISerializable | null)[] | null {
        if (data == null) {
            this.serializeNull(name);
            return data;
        }

        const parentNode = this._currentNode;
        this._currentNode = new Array(data.length);

        for (let i = 0; i < data.length; ++i) {
            this.serializableObj(data[i], `${i}`);
        }

        parentNode[name] = this._currentNode;

        this._currentNode = parentNode;
        return data;
    }

    public typedArray (data: any, name: string) : any {
        throw new Error(`Not implemented yet`);
    }

    private _serializeInternal (data: any, name: string) : any {
        if (data == null) {
            this.serializeNull(name);
        } else if (typeof data === 'number') {
            this.serializeNumber(data, name);
        } else if (typeof data === 'string') {
            this.str(data, name);
        } else if (typeof data === 'boolean') {
            this.boolean(data, name);
        } else if (data instanceof Array) {
            this.serializeArray(data, name);
        } else if (data.serialize) {
            this._isRoot = false;
            this.serializableObj(data, name);
        } else if (data instanceof Object) {
            this._isRoot = false;
            this.plainObj(data, name);
        }

        return data;
    }

    private doSerializeISerializableObject (parentNode: any, serializedNode: any, data: ISerializable,
        name: string, objId: IObjectId, inlineData: boolean) : void {
        ++this._objectDepth;

        const oldCurrentNode = this._currentNode;
        this._currentNode = serializedNode;

        if (data.onBeforeSerialize) {
            data.onBeforeSerialize();
        }

        this._currentNode.__type__ = getClassId(data.constructor, false);

        if (!inlineData) {
            if (data.serialize) {
                data.serialize(this);
                objId.__id__ = this._serializedList.length;
                serializedNode.__index__ = objId.__id__; // For debug only, need to be deleted.
                this._serializedList.push(serializedNode);
            }
        } else if (data.serializeInlineData) {
            data.serializeInlineData(this);
        }

        this._currentNode = oldCurrentNode;

        --this._objectDepth;

        if (this._objectDepth === 0) {
            const currentStack = this._objectStack;
            this._objectStack = [];
            if (currentStack.length > 0) {
                for (const e of currentStack) {
                    this.doSerializeISerializableObject(e.parentNode, e.serializedNode, e.data, e.key, e.objId, e.inlineData);
                }

                currentStack.length = 0;
            }
        }
    }

    private serializeNull (name: string) {
        this._currentNode[name] = null;
    }

    private serializeNumber (data: number, name: string) {
        this._currentNode[name] = data;
    }

    private serializeArray (data: any[], name: string) {
        const parentNode = this._currentNode;
        this._currentNode = new Array(data.length);

        for (let i = 0; i < data.length; ++i) {
            this._serializeInternal(data[i], `${i}`);
        }

        parentNode[name] = this._currentNode;

        this._currentNode = parentNode;
    }

    dump (): any[] {
        let serializedObj = this._serializedList;
        if (this._serializedList.length === 1) {
            serializedObj = this._serializedList[0];
        }
        return serializedObj;
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
