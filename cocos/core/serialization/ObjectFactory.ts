import { ISerializable } from './ISerializable';

export interface IObjectFactory {
    createObject(type: string) : ISerializable | null;
}
