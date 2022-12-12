import fs from 'fs';

import { MeshRenderer, DirectionalLight } from '../../../cocos/3d';
import { SceneAsset } from '../../../cocos/asset/assets/scene-asset';
import { JsonInputArchive, JsonOutputArchive } from '../../../cocos/core';
import { Details } from '../../../cocos/serialization';

describe(`new-serialization`, () => {
    describe(`json-archive`, () => {
        test('empty', () => {
            const ar = new JsonOutputArchive();
            expect(ar.dump()).toStrictEqual({});
        });

        test('demo-scene', () => {
            const light = new DirectionalLight(); //FIXME: for register direction light component to classId map.
            const meshRenderer = new MeshRenderer();

            const serializedJsonStr = fs.readFileSync('tests/core/new-serialization/demo2.scene', 'utf-8');
            const serializedJsonObj = JSON.parse(serializedJsonStr);
            const inputAr = new JsonInputArchive();

            let details = new Details();
            const sceneAsset: SceneAsset = inputAr.start(serializedJsonObj, details) as SceneAsset;

            const outputAr = new JsonOutputArchive();
            outputAr.start(sceneAsset);
            const serializedJsonObj2 = outputAr.dump();

            console.log(JSON.stringify(serializedJsonObj2, null, 2));

            console.log('ok');
        });

        // test('empty-scene-asset', () => {
        //     const ar = new JsonOutputArchive();
        //     const asset = new SceneAsset();
        //     ar.start(asset);
        //     expect(ar.dump()).toStrictEqual({ __type__: 'cc.SceneAsset', _native: '', _nativeAsset: null, scene: null });
        // });

        // test('scene-asset-with-empty-scene', () => {
        //     const ar = new JsonOutputArchive();
        //     const asset = new SceneAsset();
        //     const scene = new Scene('myscene');
        //     asset.scene = scene;
        //     ar.start(asset);
        //     const serializedObj = ar.dump();
        //     console.log(JSON.stringify(serializedObj, null, 2));

        //     const arInput = new JsonInputArchive(serializedObj);
        //     const newSceneAsset = new SceneAsset();
        //     arInput.start(newSceneAsset);

        //     const arOutput = new JsonOutputArchive();
        //     arOutput.start(newSceneAsset);
        //     const serializableObj2 = arOutput.dump();

        //     expect(serializedObj).toStrictEqual(serializableObj2);
        // });

        // test('components', () => {
        //     const ar = new JsonOutputArchive();
        //     const asset = new SceneAsset();
        //     const scene = new Scene('myscene');
        //     asset.scene = scene;
        //     const node = new Node('Main Light');
        //     node.addComponent(DirectionalLight);
        //     node.addComponent(Camera);
        //     scene.addChild(node);
        //     ar.start(asset);
        //     console.log(JSON.stringify(ar.dump(), null, 2));
        // });
    });
});
