import { IArchive } from './IArchive';
// FIXME: cycle dependence
export interface ISerializable {
    serialize?(ar: IArchive): void;

    serializeInlineData?(ar: IArchive): void;

    onBeforeSerialize?() : void;
    onAfterDeserialize?() : void;
}
