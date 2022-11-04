import fs from 'fs';
import { SceneAsset, Scene, JsonOutputArchive, Node } from '../../../cocos/core';
import { DirectionalLight } from '../../../typedoc-index';

describe(`new-serialization`, () => {
    describe(`json-archive`, () => {
        test('empty', () => {
            const ar = new JsonOutputArchive();
            expect(ar.dump()).toStrictEqual({});
        });

        // test('demo-scene', () => {
        //     const serializedJsonStr = fs.readFileSync('tests/core/new-serialization/demo.scene', 'utf-8');
        //     const serializedJsonObj = JSON.parse(serializedJsonStr);
        //     console.log(serializedJsonStr);
        // });

        test('empty-scene-asset', () => {
            const ar = new JsonOutputArchive();
            const asset = new SceneAsset();
            ar.start(asset);
            expect(ar.dump()).toStrictEqual({ __type__: 'cc.SceneAsset', _native: '', _nativeAsset: null, scene: null });
        });

        test('scene-asset-with-empty-scene', () => {
            const ar = new JsonOutputArchive();
            const asset = new SceneAsset();
            const scene = new Scene('myscene');
            asset.scene = scene;
            ar.start(asset);
            console.log(JSON.stringify(ar.dump(), null, 2));
        });

        test('direction-light', () => {
            const ar = new JsonOutputArchive();
            const asset = new SceneAsset();
            const scene = new Scene('myscene');
            asset.scene = scene;
            const node = new Node('Main Light');
            node.addComponent(DirectionalLight);
            scene.addChild(node);
            ar.start(asset);
            console.log(JSON.stringify(ar.dump(), null, 2));
        });
    });
});
