import { assert } from './utils';
import { IArchive } from './IArchive';
import { ISerializable } from './ISerializable';
import { IObjectFactory } from './ObjectFactory';

type NodeValuePrimitive = boolean | number | string | Record<string, unknown>;
type NodeValueType = NodeValuePrimitive | NodeValuePrimitive[];

export class JsonInputArchive implements IArchive {
    private _currentNode : NodeValueType;
    private _deserializedList : Record<string, any>[] = [];
    private _isRoot  = true;
    private _objectFactory: IObjectFactory | null;
    private _deserializedObjIdMap = new Map<number, ISerializable>();

    constructor (root: any | any[], objectFactory: IObjectFactory | null = null) {
        this._deserializedList = Array.isArray(root) ? root : [root];
        this._currentNode = this._deserializedList[0];
        this._objectFactory = objectFactory;
    }

    public isRoot () : boolean {
        return this._isRoot;
    }

    public anyObj (data: any, name: string) : any {
        return this._serializeInternal(data, name);
    }

    private _serializeInternal (obj: any, name: string) : any {
        let data: any = this._currentNode[name];
        if (data === undefined) {
            return data;
        } else if (data === null) {
            data = this.serializeNull(name);
        } else if (typeof data === 'number') {
            data = this.serializeNumber(obj, name);
        } else if (typeof data === 'string') {
            data = this.str(obj, name);
        } else if (typeof data === 'boolean') {
            data = this.boolean(obj, name);
        } else if (data instanceof Array) {
            data = this.serializeArray(obj, name);
        } else if (data instanceof Object) {
            this._isRoot = false;
            if (typeof data.__id__ === 'number') {
                data = this.serializableObj(obj, name);
            } else {
                data = this.plainObj(obj, name);
            }
        }

        return data;
    }

    public boolean (data: boolean, name: string) : boolean {
        return this._currentNode[name] as boolean;
    }

    public int8 (data: number, name: string) : number {
        return this._currentNode[name] as number;
    }

    public int16 (data: number, name: string) : number {
        return this._currentNode[name] as number;
    }

    public int32 (data: number, name: string) : number {
        return this._currentNode[name] as number;
    }

    public serializeInt64 (data: number, name: string) : number {
        return this._currentNode[name] as number;
    }

    public uint8 (data: number, name: string) : number {
        return this._currentNode[name] as number;
    }

    public uint16 (data: number, name: string) : number {
        return this._currentNode[name] as number;
    }

    public uint32 (data: number, name: string) : number {
        return this._currentNode[name] as number;
    }

    public serializeUint64 (data: number, name: string) : number {
        return this._currentNode[name] as number;
    }

    public float32 (data: number, name: string) : number {
        return this._currentNode[name] as number;
    }

    public float64 (data: number, name: string) : number {
        return this._currentNode[name] as number;
    }

    public str (data: string, name: string) : string {
        return this._currentNode[name] as string;
    }

    public plainObj (data: any, name: string) : any {
        this._isRoot = false;

        const parentNode = this._currentNode;
        this._currentNode = parentNode[name];

        data = data || {};

        const cur = this._currentNode as any;
        for (const key in cur) {
            // eslint-disable-next-line no-prototype-builtins
            if (!cur.hasOwnProperty(key)) {
                continue;
            }

            const value = cur[key];
            data[key] = this._serializeInternal(value, key);
        }

        this._currentNode = parentNode;
        return data;
    }

    public serializableObj (data: ISerializable | null, name: string) : ISerializable | null {
        this._isRoot = false;

        const jsonData: any = this._currentNode[name];
        if (jsonData == null) {
            return null;
        }

        const parentNode = this._currentNode;
        const hasId = typeof jsonData.__id__ === 'number';
        let index = -1;
        if (hasId) {
            index = jsonData.__id__;
            assert(index >= 0 && index < this._deserializedList.length);

            const cached = this._deserializedObjIdMap.get(index);
            if (cached) {
                return cached;
            }

            // Reset currentNode to which we index
            this._currentNode = this._deserializedList[index];
        } else {
            this._currentNode = jsonData;
        }

        const ret = data;
        if (!ret) {
            if (this._objectFactory) {
                this._objectFactory.createObject((this._currentNode as any).__type__) as ISerializable;
            } else {

            }
        }

        assert(ret);

        if (hasId && index > 0) {
            this._deserializedObjIdMap.set(index, ret);
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

        this._currentNode = parentNode;
        return ret;
    }

    public booleanArray (data: boolean[], name: string) : boolean[] {
        const parentNode = this._currentNode;

        this._currentNode = parentNode[name];

        let arr: boolean[];
        const dataArrayLength = (this._currentNode as any[]).length;
        if (Array.isArray(data)) {
            data.length = dataArrayLength;
            arr = data;
        } else {
            arr = new Array(dataArrayLength);
        }
        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this.boolean(arr[i], `${i}`);
        }

        this._currentNode = parentNode;
        return arr;
    }

    public int32Array (data: number[], name: string) : number[] {
        const parentNode = this._currentNode;

        this._currentNode = parentNode[name];

        let arr: number[];
        const dataArrayLength = (this._currentNode as any[]).length;
        if (Array.isArray(data)) {
            data.length = dataArrayLength;
            arr = data;
        } else {
            arr = new Array(dataArrayLength);
        }
        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this.int32(arr[i], `${i}`);
        }

        this._currentNode = parentNode;
        return arr;
    }

    public serializeArrayInt64 (data: number[], name: string) : number[] {
        const parentNode = this._currentNode;

        this._currentNode = parentNode[name];

        let arr: number[];
        const dataArrayLength = (this._currentNode as any[]).length;
        if (Array.isArray(data)) {
            data.length = dataArrayLength;
            arr = data;
        } else {
            arr = new Array(dataArrayLength);
        }
        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this.serializeInt64(arr[i], `${i}`);
        }

        this._currentNode = parentNode;
        return arr;
    }

    public float32Array (data: number[], name: string) : number[] {
        const parentNode = this._currentNode;

        this._currentNode = parentNode[name];

        let arr: number[];
        const dataArrayLength = (this._currentNode as any[]).length;
        if (Array.isArray(data)) {
            data.length = dataArrayLength;
            arr = data;
        } else {
            arr = new Array(dataArrayLength);
        }
        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this.float32(arr[i], `${i}`);
        }

        this._currentNode = parentNode;
        return arr;
    }

    public float64Array (data: number[], name: string) : number[] {
        const parentNode = this._currentNode;

        this._currentNode = parentNode[name];

        let arr: number[];
        const dataArrayLength = (this._currentNode as any[]).length;
        if (Array.isArray(data)) {
            data.length = dataArrayLength;
            arr = data;
        } else {
            arr = new Array(dataArrayLength);
        }
        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this.float64(arr[i], `${i}`);
        }

        this._currentNode = parentNode;
        return arr;
    }

    public strArray (data: string[], name: string) : string[] {
        const parentNode = this._currentNode;

        this._currentNode = parentNode[name];

        let arr: string[];
        const dataArrayLength = (this._currentNode as any[]).length;
        if (Array.isArray(data)) {
            data.length = dataArrayLength;
            arr = data;
        } else {
            arr = new Array(dataArrayLength);
        }
        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this.str(arr[i], `${i}`);
        }

        this._currentNode = parentNode;
        return arr;
    }

    public plainObjArray (data: any[], name: string) : any[] {
        const parentNode = this._currentNode;

        this._currentNode = parentNode[name];

        let arr: any[];
        const dataArrayLength = (this._currentNode as any[]).length;
        if (Array.isArray(data)) {
            data.length = dataArrayLength;
            arr = data;
        } else {
            arr = new Array(dataArrayLength);
        }
        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this.plainObj(arr[i], `${i}`);
        }

        this._currentNode = parentNode;
        return arr;
    }

    public serializableObjArray (data: ISerializable[] | null, name: string) : ISerializable[] | null {
        const parentNode = this._currentNode;

        this._currentNode = parentNode[name];

        let arr: ISerializable[];
        const dataArrayLength = (this._currentNode as any[]).length;
        if (Array.isArray(data)) {
            data.length = dataArrayLength;
            arr = data;
        } else {
            arr = new Array(dataArrayLength);
        }
        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this.serializableObj(arr[i], `${i}`) as ISerializable;
        }

        this._currentNode = parentNode;
        return arr;
    }

    public typedArray (data: any, name: string) : any {
        throw new Error(`not implemented yet`);
    }

    private serializeNull (name: string) : null {
        return null;
    }

    private serializeNumber (data: boolean, name: string) : number {
        return this._currentNode[name] as number;
    }

    private serializeArray (data: any[], name: string) : any[] {
        const parentNode = this._currentNode;

        this._currentNode = parentNode[name];

        let arr: any[];
        const dataArrayLength = (this._currentNode as any[]).length;
        if (Array.isArray(data)) {
            data.length = dataArrayLength;
            arr = data;
        } else {
            arr = new Array(dataArrayLength);
        }
        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this._serializeInternal(arr[i], `${i}`);
        }

        this._currentNode = parentNode;
        return arr;
    }

    isReading (): boolean {
        return true;
    }
    isWritting (): boolean {
        return false;
    }
}
