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
    Axis,
    Color3,
    DirectionalLight,
    HemisphericLight,
    MeshBuilder,
    PBRMetallicRoughnessMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    Space,
} from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadHumanoidPrefabs } from "@/frontend/assets/objects/humanoids";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { CharacterInputs } from "@/frontend/controls/characterControls/characterControlsInputs";
import { HumanoidAvatar } from "@/frontend/controls/characterControls/humanoidAvatar";

import { createSky, enablePhysics, enableShadows } from "./utils";

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

    const humanoids = await loadHumanoidPrefabs(scene, progressMonitor);

    const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);
    light.position = new Vector3(5, 5, 5).scaleInPlace(10);

    createSky(light.direction.scale(-1), scene);

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;

    const groundRadius = 40;

    const humanoidInstance = humanoids.default.spawn();
    if (!humanoidInstance.success) {
        throw new Error(`Failed to instantiate character: ${humanoidInstance.error}`);
    }

    const character = new CharacterControls(humanoidInstance.value, scene);
    character.getTransform().position.y = groundRadius;

    const humanoid2 = humanoids.default.spawn();
    if (!humanoid2.success) {
        throw new Error(`Failed to instantiate character: ${humanoid2.error}`);
    }
    const character2 = new HumanoidAvatar(humanoid2.value, scene);
    character2.getTransform().position = new Vector3(10, groundRadius, 6);

    const humanoid3 = humanoids.default.spawn();
    if (!humanoid3.success) {
        throw new Error(`Failed to instantiate character: ${humanoid3.error}`);
    }
    const character3 = new HumanoidAvatar(humanoid3.value, scene);
    character3.getTransform().position = new Vector3(10, groundRadius, 7.5);
    character3.getTransform().rotate(Axis.Y, Math.PI, Space.WORLD);

    enableShadows(light);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("thirdPerson") !== null) {
        character.setThirdPersonCameraActive();
    }

    character.getActiveCamera().attachControl();

    CharacterInputs.setEnabled(true);

    const ground = MeshBuilder.CreateIcoSphere("ground", { radius: groundRadius }, scene);

    new PhysicsAggregate(ground, PhysicsShapeType.MESH, { mass: 0 }, scene);

    const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", scene);
    groundMaterial.baseColor = new Color3(0.5, 0.5, 0.5);
    ground.material = groundMaterial;

    const walkableObject = {
        getTransform: () => ground,
    };

    character.setClosestWalkableObject(walkableObject);

    scene.onBeforeRenderObservable.add(() => {
        if (character.getActiveCamera() !== scene.activeCamera) {
            scene.activeCamera?.detachControl();

            const camera = character.getActiveCamera();
            camera.attachControl();
            scene.activeCamera = camera;
        }

        const deltaSeconds = engine.getDeltaTime() / 1000;
        character.update(deltaSeconds);
        character2.update(deltaSeconds, walkableObject);
        character3.update(deltaSeconds, walkableObject);
    });

    return scene;
}
