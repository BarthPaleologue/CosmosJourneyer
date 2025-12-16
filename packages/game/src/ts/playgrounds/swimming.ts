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
} from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadHumanoidPrefabs } from "@/frontend/assets/objects/humanoids";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { CharacterInputs } from "@/frontend/controls/characterControls/characterControlsInputs";
import { HumanoidAvatar } from "@/frontend/controls/characterControls/humanoidAvatar";

import { CollisionMask } from "@/settings";

import { createSky, enablePhysics, enableShadows } from "./utils";

export async function CreateSwimmingScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const physicsEngine = await enablePhysics(scene, new Vector3(0, -9.81, 0));

    engine.getRenderingCanvas()?.addEventListener("click", async () => {
        await engine.getRenderingCanvas()?.requestPointerLock();
    });

    const humanoids = await loadHumanoidPrefabs(scene, progressMonitor);

    const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);
    light.position = new Vector3(5, 5, 5).scaleInPlace(10);

    createSky(light.direction.scale(-1), scene);

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;

    const humanoidInstance = humanoids.placeholder.spawn();
    if (!humanoidInstance.success) {
        throw new Error(`Failed to instantiate character: ${humanoidInstance.error}`);
    }

    const character = new HumanoidAvatar(humanoidInstance.value, physicsEngine, scene);

    const characterControls = new CharacterControls(character, scene);
    characterControls.setThirdPersonCameraActive();

    enableShadows(light);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("firstPerson") !== null) {
        characterControls.setFirstPersonCameraActive();
    }

    characterControls.getActiveCamera().attachControl();
    characterControls.getActiveCamera().minZ = 0.1;

    CharacterInputs.setEnabled(true);

    const groundSize = 40;

    const ground = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, scene);

    const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, restitution: 0.2 }, scene);
    groundAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    groundAggregate.shape.filterCollideMask = CollisionMask.EVERYTHING & ~CollisionMask.ENVIRONMENT;

    const waterPlane = MeshBuilder.CreateGround(
        "waterPlane",
        { width: groundSize, height: groundSize, subdivisions: 1 },
        scene,
    );
    waterPlane.position.y = 3;
    waterPlane.visibility = 0.5;

    const waterPlaneAggregate = new PhysicsAggregate(waterPlane, PhysicsShapeType.BOX, { mass: 0 }, scene);
    waterPlaneAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT | CollisionMask.WATER;
    waterPlaneAggregate.shape.filterCollideMask = CollisionMask.SURFACE_QUERY;

    const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", scene);
    groundMaterial.baseColor = new Color3(0.5, 0.5, 0.5);
    ground.material = groundMaterial;

    const beach = MeshBuilder.CreateGround("beach", { width: groundSize, height: groundSize }, scene);
    beach.rotate(Axis.Z, Math.PI / 16);

    const beachAggregate = new PhysicsAggregate(beach, PhysicsShapeType.BOX, { mass: 0, restitution: 0.2 }, scene);
    beachAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    beachAggregate.shape.filterCollideMask = CollisionMask.EVERYTHING & ~CollisionMask.ENVIRONMENT;

    const beachMaterial = new PBRMetallicRoughnessMaterial("beachMaterial", scene);
    beachMaterial.baseColor = new Color3(0.8, 0.7, 0.5);
    beach.material = beachMaterial;

    characterControls.getTransform().position.y = 5;

    scene.onBeforeRenderObservable.add(() => {
        if (characterControls.getActiveCamera() !== scene.activeCamera) {
            scene.activeCamera?.detachControl();

            const camera = characterControls.getActiveCamera();
            camera.attachControl();
            scene.activeCamera = camera;
        }

        const deltaSeconds = engine.getDeltaTime() / 1000;
        characterControls.update(deltaSeconds);
    });

    return scene;
}
