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
    AbstractMesh,
    Color3,
    DirectionalLight,
    HemisphericLight,
    MeshBuilder,
    PBRMetallicRoughnessMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    ShadowGenerator
} from "@babylonjs/core";
import { enablePhysics } from "./utils";
import { CharacterControls } from "../characterControls/characterControls";
import { CharacterInputs } from "../characterControls/characterControlsInputs";
import { loadRenderingAssets } from "../assets/renderingAssets";

export async function createCharacterDemoScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene, new Vector3(0, -9.81, 0));

    engine.getRenderingCanvas()?.addEventListener("click", async () => {
        await engine.getRenderingCanvas()?.requestPointerLock();
    });

    const assets = await loadRenderingAssets((loadedCount, totalCount, name) => {
        progressCallback(loadedCount / totalCount, `Loading ${name}`);
    }, scene);

    const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);
    light.position = new Vector3(5, 5, 5).scaleInPlace(10);

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;

    const shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.useBlurExponentialShadowMap = true;

    const characterObject = assets.objects.character.instantiateHierarchy(null);
    if (!(characterObject instanceof AbstractMesh)) {
        throw new Error("Character object is null");
    }

    const character = new CharacterControls(characterObject, scene);
    character.getTransform().position.y = 30;

    character.getActiveCamera().attachControl();

    CharacterInputs.setEnabled(true);

    shadowGenerator.addShadowCaster(character.character);

    const ground = MeshBuilder.CreateIcoSphere("ground", { radius: 20 }, scene);

    const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.MESH, { mass: 0 }, scene);

    const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", scene);
    groundMaterial.baseColor = new Color3(0.5, 0.5, 0.5);
    ground.material = groundMaterial;
    ground.receiveShadows = true;

    character.setClosestWalkableObject({
        getTransform: () => ground
    });

    scene.onBeforeRenderObservable.add(() => {
        if (character.getActiveCamera() !== scene.activeCamera) {
            scene.activeCamera?.detachControl();

            const camera = character.getActiveCamera();
            camera.attachControl();
            scene.activeCamera = camera;
        }

        const deltaSeconds = engine.getDeltaTime() / 1000;
        character.update(deltaSeconds);
    });

    return scene;
}
