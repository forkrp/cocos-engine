import { ISerializable } from './ISerializable';

export function assert (cond) {
    if (!cond) {
        throw new Error(`==> FATAL ERROR ...`);
    }
}

export enum SerializeTag {
    TAG_NUMBER = 100,
    TAG_NULL,
    TAG_BOOLEAN,
    TAG_STRING,
    TAG_SERIALIZABLE_OBJECT,
    TAG_MAP,
    TAG_ARRAY
}

export function checkISerializableObjectNeedInline (data: ISerializable, isRoot: boolean) {
    let inlineData = false;
    const serializeExist = !!data.serialize;
    const serializeInlineData = !!data.serializeInlineData;

    if (serializeExist && serializeInlineData) {
        if (!isRoot) {
            inlineData = true;
        }
    } else if (serializeInlineData) {
        inlineData = true;
    }
    return inlineData;
}
