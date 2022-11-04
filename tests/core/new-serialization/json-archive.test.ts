import fs from 'fs';
import { SceneAsset, Scene, JsonOutputArchive, Node, JsonInputArchive, Camera, RenderTexture } from '../../../cocos/core';
import { DirectionalLight } from '../../../cocos/3d/lights';

describe(`new-serialization`, () => {
    describe(`json-archive`, () => {
        test('empty', () => {
            const ar = new JsonOutputArchive();
            expect(ar.dump()).toStrictEqual({});
        });

        test('demo-scene', () => {
            const light = new DirectionalLight(); //FIXME: for register direction light component to classId map.

            const serializedJsonStr = fs.readFileSync('tests/core/new-serialization/demo.scene', 'utf-8');
            const serializedJsonObj = JSON.parse(serializedJsonStr);
            const inputAr = new JsonInputArchive(serializedJsonObj);
            const sceneAsset = new SceneAsset();
            inputAr.start(sceneAsset);

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
