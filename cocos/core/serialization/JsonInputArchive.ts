import { legacyCC } from '../global-exports';
import { assert } from './utils';
import { IArchive } from './IArchive';
import { ISerializable } from './ISerializable';
import { getClassById } from '../utils/js-typed';
import { js } from '../utils/js';
import { reportMissingClass as defaultReportMissingClass } from '../data/report-missing-class';

type NodeValuePrimitive = boolean | number | string | Record<string, unknown>;
type NodeValueType = NodeValuePrimitive | NodeValuePrimitive[];

type Ctor<T> = new() => T;
// eslint-disable-next-line @typescript-eslint/ban-types
type AnyCtor = Ctor<Object>;

interface ICustomHandler {
    result: Details,
    customEnv: any,
}

export type ReportMissingClass = (id: string) => void;
interface IOptions extends Partial<ICustomHandler> {
    classFinder?: InputArchiveClassFinder;
    reportMissingClass: ReportMissingClass;
    _version?: number;
}

type StringIndex = number;
type InstanceIndex = number;

// Includes Bitwise NOT value.
// Both T and U have non-negative integer ranges.
// When the value >= 0 represents T
// When the value is < 0, it represents ~U. Use ~x to extract the value of U.
type Bnot<T extends number, U extends number> = T|U;

// When the value >= 0 represents the string index
// When the value is < 0, it just represents non-negative integer. Use ~x to extract the value.
type StringIndexBnotNumber = Bnot<StringIndex, number>;

/**
 * @en Contains information collected during deserialization
 * @zh 包含反序列化时的一些信息。
 * @class Details
 */
export class Details {
    /**
     * @en
     * the object list whose field needs to load asset by uuid
     * @zh
     * 对象列表，其中每个对象有属性需要通过 uuid 进行资源加载
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    uuidObjList: (object|InstanceIndex)[] | null = null;
    /**
     * @en
     * the corresponding field name which referenced to the asset
     * @zh
     * 引用着资源的字段名称
     */
    uuidPropList: (StringIndexBnotNumber|string)[] | null = null;
    /**
     * @en
     * list of the depends assets' uuid
     * @zh
     * 依赖资源的 uuid 列表
     */
    uuidList: (StringIndex|string)[] | null = null;

    /**
     * @en
     * list of the depends assets' type
     * @zh
     * 依赖的资源类型列表
     */
    uuidTypeList: string[] = [];

    static pool = new js.Pool((obj: Details) => {
        obj.reset();
    }, 5);

    /**
     * @method init
     * @param {Object} data
     */
    init () {
        // could be used by deserialize-dynamic
        const used = this.uuidList;
        if (!used) {
            this.uuidList = [];
            this.uuidObjList = [];
            this.uuidPropList = [];
            this.uuidTypeList = [];
        }
    }

    /**
     * @method reset
     */
    reset () {
        // could be reused by deserialize-dynamic
        const used = this.uuidList;
        if (used) {
            this.uuidList!.length = 0;
            this.uuidObjList!.length = 0;
            this.uuidPropList!.length = 0;
            this.uuidTypeList.length = 0;
        }
    }

    /**
     * @method push
     * @param {Object} obj
     * @param {String} propName
     * @param {String} uuid
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    push (obj: object, propName: string, uuid: string, type?: string) {
        this.uuidObjList!.push(obj);
        this.uuidPropList!.push(propName);
        this.uuidList!.push(uuid);
        this.uuidTypeList.push(type || '');
    }
}
Details.pool.get = function get () {
    return this._get() || new Details();
};

export type InputArchiveDetails = Details;

export type InputArchiveClassConstructor = new () => unknown;

export type InputArchiveClassFinder = {
    // eslint-disable-next-line max-len
    (id: string, serialized: unknown, owner?: unknown[] | Record<PropertyKey, unknown>, propName?: string): InputArchiveClassConstructor | undefined;

    // eslint-disable-next-line max-len
    onDereferenced?: (deserializedList: Array<Record<PropertyKey, unknown> | undefined>, id: number, object: Record<string, unknown> | unknown[], propName: string) => void;
};
export class JsonInputArchive implements IArchive {
    private _currentNode : NodeValueType = {};
    private _serializedData : Record<string, any>[] = [];
    private _isRoot  = true;
    private _deserializedObjIdMap = new Map<number, ISerializable>();
    private _borrowDetails = false;
    private _details: Details | null = null;
    private _classFinder: InputArchiveClassFinder | null = null;
    private _reportMissingClass: ReportMissingClass | null = null;
    private _currentOwner: any | null = null;

    constructor () {

    }

    public start (root: any | any[], details: Details | any, options?: IOptions | any) : unknown {
        this._serializedData = Array.isArray(root) ? root : [root];
        this._currentNode = this._serializedData[0];
        this._borrowDetails = !details;
        this._details = details || Details.pool.get();

        options = options || {};
        this._classFinder = options.classFinder || js.getClassById;
        const createAssetRefs = options.createAssetRefs;//cjh || sys.platform === Platform.EDITOR_CORE;
        const customEnv = options.customEnv;
        const ignoreEditorOnly = options.ignoreEditorOnly;
        this._reportMissingClass = options.reportMissingClass ?? defaultReportMissingClass;

        details.init();

        legacyCC.game._isCloning = true;

        const obj = this.createObjectByJsonValue(this._currentNode);
        if (obj) {
            this._currentOwner = obj;
            if (obj.serialize) {
                obj.serialize(this);
            } else if (obj.serializeInlineData) {
                obj.serializeInlineData(this);
            }
        }

        legacyCC.game._isCloning = false;

        return obj;
    }

    private createObjectByJsonValue (value: any): ISerializable | null {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const type = value.__type__ as unknown as string;
        const klass = this._classFinder!(type, value, undefined, undefined);
        if (!klass) {
            const notReported = this._classFinder === js.getClassById;
            if (notReported) {
                this._reportMissingClass!(type);
            }
            return null;
        }

        const createObject = (constructor: InputArchiveClassConstructor) => {
            // eslint-disable-next-line new-cap
            const obj = new constructor() as Record<string, unknown>;
            // if (globalIndex >= 0) {
            // this._deserializedList[globalIndex] = obj;
            // }
            return obj;
        };

        return createObject(klass) as ISerializable;
    }

    public isRoot () : boolean {
        return this._isRoot;
    }

    public anyValue (data: any, name: string) : any {
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

    public int64 (data: number, name: string) : number {
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

    public uint64 (data: number, name: string) : number {
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

        const oldOwner = this._currentOwner;
        this._currentOwner = data;

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
        this._currentOwner = oldOwner;
        return data;
    }

    public serializableObj (data: ISerializable | null, name: string) : ISerializable | null {
        this._isRoot = false;

        const jsonData: any = this._currentNode[name];
        if (jsonData == null) {
            return null;
        }

        const uuid = jsonData.__uuid__;// TODO(cjh): use typescript type
        if (uuid) {
            const expectedType = jsonData.__expectedType__; // TODO(cjh): use typescript type
            this._details!.push(this._currentOwner, name, uuid, expectedType);
            return null;
        }

        const parentNode = this._currentNode;
        const hasId = typeof jsonData.__id__ === 'number';
        let index = -1;
        if (hasId) {
            index = jsonData.__id__;
            assert(index >= 0 && index < this._serializedData.length);

            const cached = this._deserializedObjIdMap.get(index);
            if (cached) {
                return cached;
            }

            // Reset currentNode to which we index
            this._currentNode = this._serializedData[index];
        } else {
            this._currentNode = jsonData;
        }

        let ret = data;
        if (!ret) {
            ret = this.createObjectByJsonValue(this._currentNode);
            if (!ret) {
                const type = (this._currentNode as any).__type__ as string;
                console.error(`Could not find class: ${type}`);
                this._currentNode = parentNode;
                return null;
            }
        }

        assert(ret);

        if (ret) {
            const oldOwner = this._currentOwner;
            this._currentOwner = ret;
            if (hasId && index >= 0) {
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

            this._currentOwner = oldOwner;
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
        if (this._currentNode == null) {
            this._currentNode = parentNode;
            return data;
        }

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

    public serializableObjArray (data: (ISerializable | null)[] | null, name: string) : (ISerializable | null)[] | null {
        const parentNode = this._currentNode;

        this._currentNode = parentNode[name];

        let arr: (ISerializable | null)[];
        const dataArrayLength = (this._currentNode as any[]).length;
        if (Array.isArray(data)) {
            data.length = dataArrayLength;
            arr = data;
        } else {
            arr = new Array(dataArrayLength);
        }

        const oldOwner = this._currentOwner;
        this._currentOwner = arr;

        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this.serializableObj(arr[i], `${i}`) as ISerializable;
        }

        this._currentNode = parentNode;
        this._currentOwner = oldOwner;
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

        const oldOwner = this._currentOwner;
        this._currentOwner = arr;

        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this._serializeInternal(arr[i], `${i}`);
        }

        this._currentNode = parentNode;
        this._currentOwner = oldOwner;
        return arr;
    }

    isReading (): boolean {
        return true;
    }
    isWritting (): boolean {
        return false;
    }

    isExporting (): boolean {
        return false;
    }
}
