import { legacyCC } from '../global-exports';
import { js } from '../utils/js';
import { getClassId } from '../utils/js-typed';
import { IArchive } from './IArchive';
import { ISerializable } from './ISerializable';
import { IObjectFactory } from './ObjectFactory';
import { SerializeData } from './SerializeData';
import { SerializeTag, assert, ObjectKindFlag } from './utils';
import { reportMissingClass as defaultReportMissingClass } from '../../serialization/report-missing-class';

type Ctor<T> = new() => T;
// eslint-disable-next-line @typescript-eslint/ban-types
type AnyCtor = Ctor<Object>;

interface ICustomHandler {
    result: Details,
    customEnv: any,
}

type ReportMissingClass = (id: string) => void;
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
class Details {
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

type InputArchiveDetails = Details;

type InputArchiveClassConstructor = new () => unknown;

type InputArchiveClassFinder = {
    // eslint-disable-next-line max-len
    (id: string, serialized: unknown, owner?: unknown[] | Record<PropertyKey, unknown>, propName?: string): InputArchiveClassConstructor | undefined;

    // eslint-disable-next-line max-len
    onDereferenced?: (deserializedList: Array<Record<PropertyKey, unknown> | undefined>, id: number, object: Record<string, unknown> | unknown[], propName: string) => void;
};

class DeserializeNode {
    private _data: SerializeData;
    private _offset = 0;
    private _name = '';

    constructor (name: string, bufferView: Uint8Array) {
        this._name = name;
        this._data = new SerializeData(bufferView);
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

    isUndefined (): boolean {
        const ret = this._data.getInt8(this._offset);
        ++this._offset;
        return ret === SerializeTag.TAG_UNDEFINED;
    }

    isNull (): boolean {
        const ret = this._data.getInt8(this._offset);
        return ret === SerializeTag.TAG_NULL;
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
        const strBytes = this._data.getUint32(this._offset);
        const ret = this._data.getString(this._offset + 4, strBytes);
        this._offset += (strBytes + 1 + 4); // 4 is how many bytes of string.
        return ret;
    }
}

export class BinaryInputArchive implements IArchive {
    private _uuidList: string[] = [];
    private _stringList: string[] = [];
    private _currentNode!: DeserializeNode;
    private _isRoot = true;
    // private _objectFactory: IObjectFactory;
    // offset -> ISerializable
    private _deserializedObjIdMap = new Map<number, ISerializable>();

    private _borrowDetails = false;
    private _details: Details | null = null;
    private _classFinder: InputArchiveClassFinder | null = null;
    private _reportMissingClass: ReportMissingClass | null = null;
    private _currentOwner: any = null;
    public jsbArchive: any = null;

    constructor () {

    }

    public get deserializedMap () {
        return this._deserializedObjIdMap;
    }

    public start (buffer: Uint8Array, details: Details | any, options?: IOptions | any): unknown {
        this._currentNode = new DeserializeNode('root', buffer);
        // this._objectFactory = objectFactory;

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

        const uuidCount = this._currentNode.popUint32();
        for (let i = 0; i < uuidCount; ++i) {
            const uuid = this._currentNode.popString();
            this._uuidList.push(uuid);
        }

        const stringCount = this._currentNode.popUint32();
        for (let i = 0; i < stringCount; ++i) {
            const str = this._currentNode.popString();
            this._stringList.push(str);
        }

        const type: string = this._popString();
        const obj = this.createObjectByType(type);
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

    public initAndDontSerialize (bufferView: Uint8Array, details: Details | any, options?: IOptions | any) {
        this._currentNode = new DeserializeNode('root', bufferView);
        // this._objectFactory = objectFactory;

        this._borrowDetails = !details;
        this._details = details || Details.pool.get();

        options = options || {};
        this._classFinder = options.classFinder || js.getClassById;
        const createAssetRefs = options.createAssetRefs;//cjh || sys.platform === Platform.EDITOR_CORE;
        const customEnv = options.customEnv;
        const ignoreEditorOnly = options.ignoreEditorOnly;
        this._reportMissingClass = options.reportMissingClass ?? defaultReportMissingClass;

        details.init();

        // const uuidCount = this._currentNode.popUint32();
        // for (let i = 0; i < uuidCount; ++i) {
        //     const uuid = this._currentNode.popString();
        //     this._uuidList.push(uuid);
        // }

        // const stringCount = this._currentNode.popUint32();
        // for (let i = 0; i < stringCount; ++i) {
        //     const str = this._currentNode.popString();
        //     this._stringList.push(str);
        // }
    }

    // Invoked by native
    protected _setUuidAndStringList (uuidList: string[], stringList: string[]) {
        this._uuidList = uuidList;
        this._stringList = stringList;
    }

    // Invoked by native
    protected _setCurrentOffset (offset: number) {
        this._currentNode.offset = offset;
    }

    // Invoked by native
    protected _getCurrentOffset () {
        return this._currentNode.offset;
    }

    private createObjectByType (type: string): ISerializable | null {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const klass = this._classFinder!(type, undefined, undefined, undefined);
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

    public anyValue (data: any, name: string): any {
        return this._serializeInternal(data, name);
    }

    private _serializeInternal (obj: any, name: string): any {
        const currentNode = this._currentNode;
        const tag: number = currentNode.popInt8();
        switch (tag) {
        case SerializeTag.TAG_NULL:
            return null;
        case SerializeTag.TAG_NUMBER:
            return currentNode.popFloat64();
        case SerializeTag.TAG_STRING:
            return this._popString();
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

    getCurrentVariantType (name: string): number {
        return this._currentNode.data.getUint8(this._currentNode.offset);
    }

    boolean (data: boolean, name: string): boolean {
        return this._currentNode.popBoolean();
    }

    booleanOptional (data: boolean | undefined, name: string): boolean | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.boolean(data!, name);
    }

    int8 (data: number, name: string): number {
        return this._currentNode.popInt8();
    }

    int8Optional (data: number | undefined, name: string): number | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.int8(data!, name);
    }

    int16 (data: number, name: string): number {
        return this._currentNode.popInt16();
    }

    int16Optional (data: number | undefined, name: string): number | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.int16(data!, name);
    }

    int32 (data: number, name: string): number {
        return this._currentNode.popInt32();
    }

    int32Optional (data: number | undefined, name: string): number | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.int32(data!, name);
    }

    int64 (data: number, name: string): number {
        throw new Error('Method not implemented.');
    }

    int64Optional (data: number | undefined, name: string): number | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.int64(data!, name);
    }

    uint8 (data: number, name: string): number {
        return this._currentNode.popUint8();
    }

    uint8Optional (data: number | undefined, name: string): number | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.uint8(data!, name);
    }

    uint16 (data: number, name: string): number {
        return this._currentNode.popUint16();
    }

    uint16Optional (data: number | undefined, name: string): number | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.uint16(data!, name);
    }

    uint32 (data: number, name: string): number {
        return this._currentNode.popUint32();
    }

    uint32Optional (data: number | undefined, name: string): number | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.uint32(data!, name);
    }

    uint64 (data: number, name: string): number {
        throw new Error('Method not implemented.');
    }

    uint64Optional (data: number | undefined, name: string): number | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.uint64(data!, name);
    }

    float32 (data: number, name: string): number {
        return this._currentNode.popFloat32();
    }

    float32Optional (data: number | undefined, name: string): number | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.float32(data!, name);
    }

    float64 (data: number, name: string): number {
        return this._currentNode.popFloat64();
    }

    float64Optional (data: number | undefined, name: string): number | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.float64(data!, name);
    }

    str (data: string, name: string): string {
        return this._popString();
    }

    strOptional (data: string | undefined, name: string): string | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.str(data!, name);
    }

    private _popString (): string {
        const index = this._currentNode.popUint32();
        assert(index >= 0 && index < this._stringList.length);
        return this._stringList[index];
    }

    uuid (data: string): string {
        return ''; // TODO(cjh): Isn't it used in deserialization?
    }

    // TODO(cjh): Add arrObj

    plainObj (data: Record<string, unknown>, name: string): Record<string, unknown> {
        this._isRoot = false;

        data = data || {};

        const oldOwner = this._currentOwner;
        this._currentOwner = data;

        const currentNode = this._currentNode;
        const elementCount = currentNode.popInt32();

        for (let i = 0; i < elementCount; ++i) {
            const key = this._popString();
            const value = this._serializeInternal(null, key);
            data[key] = value;
        }

        this._currentOwner = oldOwner;
        return data;
    }

    public plainObjWithCallback (data: Record<string, unknown>, name: string, cb: (value: any, key: string) => unknown): Record<string, unknown> {
        this._isRoot = false;

        data = data || {};

        const oldOwner = this._currentOwner;
        this._currentOwner = data;

        const currentNode = this._currentNode;
        const elementCount = currentNode.popInt32();

        for (let i = 0; i < elementCount; ++i) {
            const key = this._popString();
            const value = cb(null, key);
            data[key] = value;
        }

        this._currentOwner = oldOwner;
        return data;
    }

    plainObjOptional (data: Record<string, unknown> | undefined, name: string): Record<string, unknown> | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.plainObj(data!, name);
    }

    serializableObj (data: ISerializable | null, name: string): ISerializable | null {
        this._isRoot = false;

        const currentNode = this._currentNode;

        const objectFlag = currentNode.popUint8();
        const isNull = objectFlag & ObjectKindFlag.NULL;
        if (isNull) {
            return null;
        }
        const isInline = objectFlag & ObjectKindFlag.INLINE;

        const currentOffset = currentNode.offset;
        let targetOffset = 0;

        if (!isInline) {
            targetOffset = currentNode.popInt32();

            if (targetOffset === -1) {
                // console.log(`return null, currentOffset: ${currentOffset-1}`);
                //cjh for debug only
                // currentNode.popInt32(); // pop targetSize;
                //
                return null;
            }

            // console.log(`==> Deserialize ISerailizable, currentOffset: ${currentOffset-1}`);

            const cached = this._deserializedObjIdMap.get(targetOffset);
            if (cached) {
                //cjh for debug only
                // currentNode.popInt32(); // pop targetSize;
                //
                return cached;
            }

            // Reset currentNode to which we index
            currentNode.offset = targetOffset;
        } else {
            // FIXME(cjh): Should not depend on uuid logic in deserialization code.
            const uuidAdvance = currentNode.popInt32();
            if (uuidAdvance !== -1) {
                currentNode.offset += uuidAdvance;
                const uuidIndex = currentNode.popUint32();
                this._details!.push(this._currentOwner, name, this._uuidList[uuidIndex]);

                return null;
            }
        }

        const type = this._popString(); // Pop __type__
        const ret = data || this.createObjectByType(type) as ISerializable;
        assert(ret);

        const oldOwner = this._currentOwner;
        this._currentOwner = ret;

        if (!isInline) {
            this._deserializedObjIdMap.set(targetOffset, ret);
        }

        let serializeMethod;
        const serializeCppExist = !!(ret as any).serializeCpp;
        const serializeExist = !!ret.serialize;
        const serializeInlineDataExist = !!ret.serializeInlineData;

        if (serializeCppExist) {
            serializeMethod = (ret as any).serializeCpp;
            this.jsbArchive.currentOffset = this._getCurrentOffset();
        } else if (serializeExist && serializeInlineDataExist) {
            if (this._isRoot) {
                serializeMethod = ret.serialize;
            } else {
                serializeMethod = ret.serializeInlineData;
            }
        } else if (serializeExist) {
            serializeMethod = ret.serialize;
        } else if (serializeInlineDataExist) {
            serializeMethod = ret.serializeInlineData;
        }

        serializeMethod.call(ret, this);

        if (ret.onAfterDeserialize) {
            ret.onAfterDeserialize();
        }

        if (!isInline) {
            // currentNode.offset = currentOffset + 8; // 8 is targetOffset + targetSize, for debug only
            currentNode.offset = currentOffset + 4;
        }

        this._currentOwner = oldOwner;
        return ret;
    }

    serializableObjOptional (data: ISerializable | null | undefined, name: string): ISerializable | null | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.serializableObj(data!, name);
    }

    booleanArray (data: boolean[], name: string): boolean[] {
        throw new Error('Method not implemented.');
    }

    booleanArrayOptional (data: boolean[] | undefined, name: string): boolean[] | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.booleanArray(data!, name);
    }

    int32Array (data: number[], name: string): number[] {
        throw new Error('Method not implemented.');
    }

    int32ArrayOptional (data: number[] | undefined, name: string): number[] | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.int32Array(data!, name);
    }

    int64Array (data: number[], name: string): number[] {
        throw new Error('Method not implemented.');
    }

    int64ArrayOptional (data: number[] | undefined, name: string): number[] | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.int64Array(data!, name);
    }

    float32Array (data: number[], name: string): number[] {
        let length = 0;//TODO(cjh): The code for handling array is similar, should unify it.
        const currentNode = this._currentNode;
        const tag = currentNode.popInt8();
        if (tag === SerializeTag.TAG_NULL) {
            return data;
        } else if (tag === SerializeTag.TAG_ARRAY) {
            length = currentNode.popInt32();
        } else {
            assert(false);
        }

        let arr: number[];
        if (Array.isArray(data)) {
            data.length = length;
            arr = data;
        } else {
            arr = new Array(length);
        }

        const oldOwner = this._currentOwner;
        this._currentOwner = arr;

        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this.float32(arr[i], `${i}`);
        }

        this._currentOwner = oldOwner;
        return arr;
    }

    float32ArrayOptional (data: number[] | undefined, name: string): number[] | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.float32Array(data!, name);
    }

    float64Array (data: number[], name: string): number[] {
        throw new Error('Method not implemented.');
    }

    float64ArrayOptional (data: number[] | undefined, name: string): number[] | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.float64Array(data!, name);
    }

    strArray (data: string[], name: string): string[] {
        throw new Error('Method not implemented.');
    }

    strArrayOptional (data: string[] | undefined, name: string): string[] | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.strArray(data!, name);
    }

    plainObjArray (data: Record<string, unknown>[], name: string): Record<string, unknown>[] {
        let length = 0;
        const currentNode = this._currentNode;
        const tag = currentNode.popInt8();
        if (tag === SerializeTag.TAG_NULL) {
            return data;
        } else if (tag === SerializeTag.TAG_ARRAY) {
            length = currentNode.popInt32();
        } else {
            assert(false);
        }

        let arr: Record<string, unknown>[];
        if (Array.isArray(data)) {
            data.length = length;
            arr = data;
        } else {
            arr = new Array(length);
        }

        const oldOwner = this._currentOwner;
        this._currentOwner = arr;

        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this.plainObj(arr[i], `${i}`);
        }

        this._currentOwner = oldOwner;
        return arr;
    }

    plainObjArrayOptional (data: Record<string, unknown>[] | undefined, name: string): Record<string, unknown>[] | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.plainObjArray(data!, name);
    }

    serializableObjArray (data: (ISerializable | null)[] | null, name: string): (ISerializable | null)[] | null {
        let length = 0;
        const currentNode = this._currentNode;
        const tag = currentNode.popInt8();
        if (tag === SerializeTag.TAG_NULL) {
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

        const oldOwner = this._currentOwner;
        this._currentOwner = arr;

        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this.serializableObj(arr[i], `${i}`) as ISerializable;
        }

        this._currentOwner = oldOwner;
        return arr;
    }

    serializableObjArrayOptional (data: (ISerializable | null)[] | null | undefined, name: string): (ISerializable | null)[] | null | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.serializableObjArray(data!, name);
    }

    public arrayWithCallback (data: unknown[], name: string, cb: (owner: any[], i: number) => void): unknown[] {
        let length = 0;
        const currentNode = this._currentNode;
        const tag = currentNode.popInt8();
        if (tag === SerializeTag.TAG_NULL) {
            return data;
        } else if (tag === SerializeTag.TAG_ARRAY) {
            length = currentNode.popInt32();
        } else {
            assert(false);
        }

        let arr: unknown[];
        if (Array.isArray(data)) {
            data.length = length;
            arr = data;
        } else {
            arr = new Array(length);
        }

        const oldOwner = this._currentOwner;
        this._currentOwner = arr;

        for (let i = 0, len = arr.length; i < len; ++i) {
            cb(arr, i);
        }

        this._currentOwner = oldOwner;
        return arr;
    }

    public arrayWithCallbackOptional (data: unknown[] | undefined, name: string, cb: (owner: any[], i: number) => void): unknown[] | undefined {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return this.arrayWithCallback(data!, name, cb);
    }

    public optionalWithCallback (data: any, name: string, tag: number, cb: (data: any, name: string) => any): any {
        if (this._currentNode.isUndefined()) {
            return undefined;
        }
        return cb(data, name);
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

        const oldOwner = this._currentOwner;
        this._currentOwner = arr;

        for (let i = 0, len = arr.length; i < len; ++i) {
            arr[i] = this._serializeInternal(arr[i], `${i}`);
        }

        this._currentOwner = oldOwner;

        return arr;
    }

    undefinedOptional (name: string): void {
        const ret = this._currentNode.popInt8();
        assert(ret === SerializeTag.TAG_UNDEFINED);
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

    isBinary (): boolean {
        return true;
    }
}

legacyCC.BinaryInputArchive = BinaryInputArchive;
