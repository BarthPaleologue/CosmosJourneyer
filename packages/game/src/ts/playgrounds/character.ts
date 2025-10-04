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

import {
    AbstractMesh,
    Color3,
    DirectionalLight,
    HemisphericLight,
    MeshBuilder,
    PBRMetallicRoughnessMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    ShadowGenerator,
} from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadCharacters } from "@/frontend/assets/objects/characters";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { CharacterInputs } from "@/frontend/controls/characterControls/characterControlsInputs";

import { enablePhysics } from "./utils";

export async function createCharacterDemoScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene, new Vector3(0, -9.81, 0));

    engine.getRenderingCanvas()?.addEventListener("click", async () => {
        await engine.getRenderingCanvas()?.requestPointerLock();
    });

    const characters = await loadCharacters(scene, progressMonitor);

    const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);
    light.position = new Vector3(5, 5, 5).scaleInPlace(10);

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;

    const shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.useBlurExponentialShadowMap = true;

    const characterObject = characters.default.instantiateHierarchy(null);
    if (!(characterObject instanceof AbstractMesh)) {
        throw new Error("Character object is null");
    }

    const groundRadius = 40;

    const character = new CharacterControls(characterObject, scene);
    character.getTransform().position.y = groundRadius;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("thirdPerson") !== null) {
        character.setThirdPersonCameraActive();
    }

    character.getActiveCamera().attachControl();

    CharacterInputs.setEnabled(true);

    shadowGenerator.addShadowCaster(character.character);

    const ground = MeshBuilder.CreateIcoSphere("ground", { radius: groundRadius }, scene);

    new PhysicsAggregate(ground, PhysicsShapeType.MESH, { mass: 0 }, scene);

    const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", scene);
    groundMaterial.baseColor = new Color3(0.5, 0.5, 0.5);
    ground.material = groundMaterial;
    ground.receiveShadows = true;

    character.setClosestWalkableObject({
        getTransform: () => ground,
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
