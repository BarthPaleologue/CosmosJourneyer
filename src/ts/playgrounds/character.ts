//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import {
    AssetsManager,
    Color3,
    DirectionalLight,
    HemisphericLight,
    MeshBuilder,
    PBRMetallicRoughnessMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    ShadowGenerator,
    SkeletonViewer
} from "@babylonjs/core";
import { enablePhysics } from "./utils";
import { Objects } from "../assets/objects";
import { CharacterControls } from "../characterControls/characterControls";
import { CharacterInputs } from "../characterControls/characterControlsInputs";

export async function createCharacterDemoScene(engine: AbstractEngine): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene, new Vector3(0, -9.81, 0));

    engine.getRenderingCanvas()?.addEventListener("click", async () => {
        await engine.getRenderingCanvas()?.requestPointerLock();
    });

    const assetsManager = new AssetsManager(scene);
    Objects.EnqueueTasks(assetsManager, scene);
    await assetsManager.loadAsync();

    const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);
    light.position = new Vector3(5, 5, 5).scaleInPlace(10);

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;

    const shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.useBlurExponentialShadowMap = true;

    const character = new CharacterControls(scene);
    character.getTransform().position.y = 5;

    // Create a skeleton viewer for the mesh
    const skeletonViewer = new SkeletonViewer(character.skeleton, character.characterNode, scene);
    skeletonViewer.isEnabled = true; // Enable it
    skeletonViewer.color = Color3.Red(); // Change default color from white to red

    CharacterInputs.setEnabled(true);

    shadowGenerator.addShadowCaster(character.character);

    const camera = character.getActiveCamera();
    camera.attachControl();

    scene.activeCamera = camera;

    const ground = MeshBuilder.CreateBox("ground", { width: 20, height: 1, depth: 20 }, scene);

    const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scene);

    const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", scene);
    groundMaterial.baseColor = new Color3(0.5, 0.5, 0.5);
    ground.material = groundMaterial;
    ground.receiveShadows = true;

    const box1 = MeshBuilder.CreateBox("box1", { width: 1, height: 1, depth: 1 }, scene);
    box1.position.y = 0.5;
    box1.position.x = 2;
    box1.position.z = 4;
    shadowGenerator.addShadowCaster(box1);

    const box1Aggregate = new PhysicsAggregate(box1, PhysicsShapeType.BOX, { mass: 1 }, scene);

    const box2 = MeshBuilder.CreateBox("box2", { width: 1, height: 1, depth: 1 }, scene);
    box2.position.y = 0.5;
    box2.position.x = -2;
    box2.position.z = 4;
    shadowGenerator.addShadowCaster(box2);

    const box2Aggregate = new PhysicsAggregate(box2, PhysicsShapeType.BOX, { mass: 1 }, scene);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        character.update(deltaSeconds);
    });

    return scene;
}
