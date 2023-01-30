import { ISerializable } from './ISerializable';

export interface IArchive {

    // TODO(cjh): Add reset interface

    // start(obj: ISerializable);

    //TODO: Rename all methods, remove serialize prefix for better JS package size.
    anyValue(data: any, name: string): any;

    undefinedOptional(name: string): void;

    // TODO: Should not use serialize directly, use the the following explict type for better performance and binary support.
    //
    boolean(data: boolean, name: string): boolean;
    booleanOptional(data: boolean | undefined, name: string): boolean | undefined;

    int8(data: number, name: string): number;
    int8Optional(data: number | undefined, name: string): number | undefined;

    int16(data: number, name: string): number;
    int16Optional(data: number | undefined, name: string): number | undefined;

    int32(data: number, name: string): number;
    int32Optional(data: number | undefined, name: string): number | undefined;
    // int64(data: number, name: string) : number;

    uint8(data: number, name: string): number;
    uint8Optional(data: number | undefined, name: string): number | undefined;

    uint16(data: number, name: string): number;
    uint16Optional(data: number | undefined, name: string): number | undefined;

    uint32(data: number, name: string): number;
    uint32Optional(data: number | undefined, name: string): number | undefined;
    // uint64(data: number, name: string) : number;

    float32(data: number, name: string): number;
    float32Optional(data: number | undefined, name: string): number | undefined;

    float64(data: number, name: string): number;
    float64Optional(data: number | undefined, name: string): number | undefined;

    str(data: string, name: string): string;
    strOptional(data: string | undefined, name: string): string | undefined;

    uuid(data: string): string; // TODO(cjh): Remove this

    plainObj(data: Record<string, unknown>, name: string): Record<string, unknown>;
    plainObjOptional(data: Record<string, unknown> | undefined, name: string): Record<string, unknown> | undefined;
    plainObjWithCallback(data: Record<string, unknown>, name: string, cb: (value: any, key: string) => unknown): Record<string, unknown>;

    serializableObj(data: ISerializable | null, name: string): any;
    serializableObjOptional(data: ISerializable | null | undefined, name: string): any;

    booleanArray(data: boolean[], name: string): boolean[];
    booleanArrayOptional(data: boolean[] | undefined, name: string): boolean[] | undefined;

    //TODO: add int8, int16, uint8, uint16, uint32, uint64 support
    int32Array(data: number[], name: string): number[];
    int32ArrayOptional(data: number[] | undefined, name: string): number[] | undefined;

    // int64Array(data: number[], name: string): number[];
    float32Array(data: number[], name: string): number[];
    float32ArrayOptional(data: number[] | undefined, name: string): number[] | undefined;

    float64Array(data: number[], name: string): number[];
    float64ArrayOptional(data: number[] | undefined, name: string): number[] | undefined;

    strArray(data: string[], name: string): string[];
    strArrayOptional(data: string[] | undefined, name: string): string[] | undefined;

    plainObjArray(data: Record<string, unknown>[], name: string): any;
    plainObjArrayOptional(data: Record<string, unknown>[] | undefined, name: string): any;

    serializableObjArray(data: (ISerializable | null)[] | null | undefined, name: string): any;

    arrayWithCallback(data: unknown[], name: string, cb: (owner: any[], i: number) => void): unknown[];
    arrayWithCallbackOptional(data: unknown[] | undefined, name: string, cb: (owner: any[], i: number) => void): unknown[] | undefined;

    typedArray(data: any, name: string): any;

    //

    getCurrentVariantType(name: string): number;

    optionalWithCallback(data: any, name: string, tag: number, cb: (data: any, name: string) => any): any;

    isReading(): boolean;
    isWritting(): boolean;
    isExporting(): boolean;
    isBinary(): boolean;
    isRoot(): boolean;
}
