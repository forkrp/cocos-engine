import { ccclass, serializable, editable, type } from 'cc.decorator';
import { EDITOR } from 'internal:constants';
import { cclegacy } from '../../core';
import { Prefab } from './prefab';
import { CCObject } from '../../core/data';
import { Component } from '../component';
import { Node } from '../node';
import { IArchive, ISerializable } from '../../core/serialization';

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
    // as the target's fileId in prefab asset,used to find the target when prefab expanded.
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
        this.value = ar.anyValue(this.value, 'value');
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

    // record the node with the Prefab that this prefabInstance belongs to.
    @serializable
    @type(Node)
    public prefabRootNode?: Node;

    // record children nodes that exist in this prefabInstance but not in prefab asset.
    @serializable
    @type([MountedChildrenInfo])
    public mountedChildren: MountedChildrenInfo[] = [];

    // record components that exist in this prefabInstance but not in prefab asset.
    @serializable
    @type([MountedComponentsInfo])
    public mountedComponents: MountedComponentsInfo[] = [];

    // override properties info in this prefabInstance.
    @serializable
    @type([PropertyOverrideInfo])
    public propertyOverrides: PropertyOverrideInfo[] = [];

    // record components that exist in ths prefab asset but not in prefabInstance.
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
    public root: Node | null | undefined = null;

    // reference to the prefab asset file.
    // In Editor, only asset._uuid is usable because asset will be changed.
    @serializable
    public asset: Prefab | null | undefined = null;

    // prefabInfo's id,unique in the asset.
    @serializable
    @editable
    public fileId = '';

    // Instance of a prefabAsset
    @serializable
    @type(PrefabInstance)
    public instance: PrefabInstance | null | undefined = null;

    @serializable
    @type([TargetOverrideInfo])
    public targetOverrides: TargetOverrideInfo[] = [];

    // record outMost prefabInstance nodes in descendants
    // collected when saving sceneAsset or prefabAsset
    @serializable
    public nestedPrefabInstanceRoots: Node[] = [];

    public serialize (ar: IArchive): void {
        this.root = ar.serializableObj(this.root, 'root');
        this.asset = ar.serializableObj(this.asset, 'asset');
        this.fileId = ar.str(this.fileId, 'fileId');
        this.instance = ar.serializableObj(this.instance, 'instance');
        this.targetOverrides = ar.serializableObjArray(this.targetOverrides, 'targetOverrides');
        this.nestedPrefabInstanceRoots = ar.serializableObjArray(this.nestedPrefabInstanceRoots, 'nestedPrefabInstanceRoots');
    }
}

cclegacy._PrefabInfo = PrefabInfo;
