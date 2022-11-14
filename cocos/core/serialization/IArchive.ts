import { ISerializable } from './ISerializable';

export interface IArchive {

    // TODO(cjh): Add reset interface

    start(obj: ISerializable);

    //TODO: Rename all methods, remove serialize prefix for better JS package size.
    anyObj(data: any, name: string): any;

    // TODO: Should not use serialize directly, use the the following explict type for better performance and binary support.
    //
    boolean(data: boolean, name: string): boolean;

    int8(data: number, name: string): number;
    int16(data: number, name: string): number;
    int32(data: number, name: string): number;
    // serializeInt64(data: number, name: string) : number;

    uint8(data: number, name: string): number;
    uint16(data: number, name: string): number;
    uint32(data: number, name: string): number;
    // serializeUint64(data: number, name: string) : number;

    float32(data: number, name: string): number;
    float64(data: number, name: string): number;

    str(data: string, name: string): string;

    plainObj(data: any, name: string): any;
    serializableObj(data: ISerializable | null | undefined, name: string): any;

    booleanArray(data: boolean[], name: string): boolean[];
    //TODO: add int8, int16, uint8, uint16, uint32, uint64 support
    int32Array(data: number[], name: string): number[];
    // serializeArrayInt64(data: number[], name: string): number[];
    float32Array(data: number[], name: string): number[];
    float64Array(data: number[], name: string): number[];
    strArray(data: string[], name: string): string[];
    plainObjArray(data: any[], name: string): any[];
    serializableObjArray(data: (ISerializable | null)[] | null | undefined, name: string): any;

    typedArray(data: any, name: string): any;
    //

    isReading(): boolean;
    isWritting(): boolean;
    isExporting(): boolean;
    isRoot(): boolean;
}
