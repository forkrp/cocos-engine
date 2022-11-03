import { ccclass, serializable, editable, type } from 'cc.decorator';
import { EDITOR } from 'internal:constants';
import { legacyCC } from '../../global-exports';
import { Prefab } from '../../assets';
import { CCObject } from '../../data';
import { Component } from '../../components';
import { Node } from '../../scene-graph';
import { IArchive, ISerializable } from '../../serialization';

function compareStringArray (array1: string[] | undefined, array2: string[] | undefined) {
    if (!array1 || !array2) {
        return false;
    }

    if (array1.length !== array2.length) {
        return false;
    }

    return array1.every((value, index) => value === array2[index]);
}

@ccclass('cc.TargetInfo')
export class TargetInfo implements ISerializable {
    // 用于标识目标在prefab 资源中的ID，区别于UUID
    @serializable
    public localID: string[] = [];

    serialize (ar: IArchive): void {
        this.localID = ar.strArray(this.localID, 'localID');
    }
}
@ccclass('cc.TargetOverrideInfo')
export class TargetOverrideInfo implements ISerializable {
    @serializable
    @type(CCObject)
    public source: Component | Node | null = null;
    // if owner is in a prefab, use TargetInfo to index it
    @serializable
    @type(TargetInfo)
    public sourceInfo: TargetInfo | null = null;
    @serializable
    public propertyPath: string[] = [];
    @serializable
    @type(Node)
    public target: Node | null = null;
    // if target is in a prefab, use TargetInfo to index it
    @serializable
    @type(TargetInfo)
    public targetInfo: TargetInfo | null = null;

    serialize (ar: IArchive): void {
        this.source = ar.serializableObj(this.source, 'source');
        this.sourceInfo = ar.serializableObj(this.sourceInfo, 'sourceInfo');
        this.propertyPath = ar.strArray(this.propertyPath, 'propertyPath');
        this.target = ar.serializableObj(this.target, 'target');
        this.targetInfo = ar.serializableObj(this.targetInfo, 'targetInfo');
    }
}

@ccclass('cc.CompPrefabInfo')
export class CompPrefabInfo implements ISerializable {
    // To identify current component in a prefab asset, so only needs to be unique.
    @serializable
    @editable
    public fileId = '';

    serialize (ar: IArchive): void {
        this.fileId = ar.str(this.fileId, 'fileId');
    }
}

@ccclass('CCPropertyOverrideInfo')
export class PropertyOverrideInfo implements ISerializable {
    @serializable
    @type(TargetInfo)
    public targetInfo: TargetInfo | null = null;
    @serializable
    public propertyPath: string[] = [];
    @serializable
    public value: any;

    // eslint-disable-next-line consistent-return
    public isTarget (localID: string[], propPath: string[]) {
        if (EDITOR) {
            return compareStringArray(this.targetInfo?.localID, localID)
                && compareStringArray(this.propertyPath, propPath);
        }
    }

    serialize (ar: IArchive): void {
        this.targetInfo = ar.serializableObj(this.targetInfo, 'targetInfo');
        this.propertyPath = ar.strArray(this.propertyPath, 'propertyPath');
        this.value = ar.anyObj(this.value, 'value');
    }
}

@ccclass('cc.MountedChildrenInfo')
export class MountedChildrenInfo implements ISerializable {
    @serializable
    @type(TargetInfo)
    public targetInfo: TargetInfo | null = null;
    @serializable
    @type([Node])
    public nodes: Node[] = [];

    // eslint-disable-next-line consistent-return
    public isTarget (localID: string[]) {
        if (EDITOR) {
            return compareStringArray(this.targetInfo?.localID, localID);
        }
    }

    serialize (ar: IArchive): void {
        this.targetInfo = ar.serializableObj(this.targetInfo, 'targetInfo');
        this.nodes = ar.serializableObjArray(this.nodes, 'nodes');
    }
}

@ccclass('cc.MountedComponentsInfo')
export class MountedComponentsInfo implements ISerializable {
    @serializable
    @type(TargetInfo)
    public targetInfo: TargetInfo | null = null;
    @serializable
    @type([Component])
    public components: Component[] = [];

    // eslint-disable-next-line consistent-return
    public isTarget (localID: string[]) {
        if (EDITOR) {
            return compareStringArray(this.targetInfo?.localID, localID);
        }
    }

    serialize (ar: IArchive): void {
        this.targetInfo = ar.serializableObj(this.targetInfo, 'targetInfo');
        this.components = ar.serializableObjArray(this.components, 'components');
    }
}

/**
 * Prefab实例类
 * @internal
 */
@ccclass('cc.PrefabInstance')
export class PrefabInstance implements ISerializable {
    // Identify current prefabInstance;
    @serializable
    public fileId = '';

    // 记录PrefabInstance所属的Prefab的Root节点信息
    @serializable
    @type(Node)
    public prefabRootNode?: Node;

    // 实例化的Prefab中额外增加的子节点数据
    @serializable
    @type([MountedChildrenInfo])
    public mountedChildren: MountedChildrenInfo[] = [];

    // 实例化的Prefab中额外增加的Component数据
    @serializable
    @type([MountedComponentsInfo])
    public mountedComponents: MountedComponentsInfo[] = [];

    // 属性的覆盖数据
    @serializable
    @type([PropertyOverrideInfo])
    public propertyOverrides: PropertyOverrideInfo[] = [];

    @serializable
    @type([TargetInfo])
    public removedComponents: TargetInfo[] = [];

    public targetMap: Record<string, any | Node | Component> = {};

    /**
     * make sure prefab instance expand only once
     * @internal
     */
    public expanded = false;

    // eslint-disable-next-line consistent-return
    public findPropertyOverride (localID: string[], propPath: string[]) {
        if (EDITOR) {
            for (let i = 0; i < this.propertyOverrides.length; i++) {
                const propertyOverride = this.propertyOverrides[i];
                if (propertyOverride.isTarget(localID, propPath)) {
                    return propertyOverride;
                }
            }
            return null;
        }
    }

    public removePropertyOverride (localID: string[], propPath: string[]) {
        if (EDITOR) {
            for (let i = 0; i < this.propertyOverrides.length; i++) {
                const propertyOverride = this.propertyOverrides[i];
                if (propertyOverride.isTarget(localID, propPath)) {
                    this.propertyOverrides.splice(i, 1);
                    break;
                }
            }
        }
    }

    serialize (ar: IArchive): void {
        this.fileId = ar.str(this.fileId, 'fileId');
        this.prefabRootNode = ar.serializableObj(this.prefabRootNode, 'prefabRootNode');
        this.mountedChildren = ar.serializableObjArray(this.mountedChildren, 'mountedChildren');
        this.mountedComponents = ar.serializableObjArray(this.mountedComponents, 'mountedComponents');
        this.propertyOverrides = ar.serializableObjArray(this.propertyOverrides, 'propertyOverrides');
        this.removedComponents = ar.serializableObjArray(this.removedComponents, 'removedComponents');
    }
}

@ccclass('cc.PrefabInfo')
export class PrefabInfo implements ISerializable {
    // the most top node of this prefab in the scene
    @serializable
    @type(Node)
    public root?: Node;

    // 所属的 prefab 资源对象 (cc.Prefab)
    // In Editor, only asset._uuid is usable because asset will be changed.
    @serializable
    public asset?: Prefab;

    // 用来标识别该节点在 prefab 资源中的位置，因此这个 ID 只需要保证在 Assets 里不重复就行
    @serializable
    @editable
    public fileId = '';

    // Instance of a prefabAsset
    @serializable
    @type(PrefabInstance)
    public instance?: PrefabInstance;

    @serializable
    @type([TargetOverrideInfo])
    public targetOverrides?: TargetOverrideInfo[];

    // record outMost prefabInstance nodes in descendants
    // collected when saving sceneAsset or prefabAsset
    @serializable
    public nestedPrefabInstanceRoots?: Node[];

    public serialize (ar: IArchive): void {
        this.asset = ar.serializableObj(this.asset, 'asset');
        this.fileId = ar.str(this.fileId, 'fileId');
        this.instance = ar.serializableObj(this.instance, 'instance');
        this.targetOverrides = ar.serializableObjArray(this.targetOverrides, 'targetOverrides');
        this.nestedPrefabInstanceRoots = ar.serializableObjArray(this.nestedPrefabInstanceRoots, 'nestedPrefabInstanceRoots');
    }
}

legacyCC._PrefabInfo = PrefabInfo;
