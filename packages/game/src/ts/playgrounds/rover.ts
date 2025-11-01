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
    ArcRotateCamera,
    Color3,
    DirectionalLight,
    MeshBuilder,
    PBRMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    ShadowGenerator,
    Vector3,
    type AbstractEngine,
} from "@babylonjs/core";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadCharacters } from "@/frontend/assets/objects/characters";
import { loadTireTextures } from "@/frontend/assets/textures/materials/tire";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { VehicleControls } from "@/frontend/vehicle/vehicleControls";
import { createWolfMk2 } from "@/frontend/vehicle/worlfMk2";

import { enablePhysics } from "./utils";

export async function createRoverScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene, new Vector3(0, -9.81, 0));

    const camera = new ArcRotateCamera("camera", Math.PI / 2, -Math.PI / 3, 50, Vector3.Zero(), scene);
    camera.attachControl();

    const sun = new DirectionalLight("sun", new Vector3(0, -1, -1), scene);
    sun.position = new Vector3(0, 50, 50);
    sun.autoUpdateExtends = true;
    scene.onAfterRenderObservable.addOnce(() => {
        sun.autoUpdateExtends = false;
    });

    const shadowGenerator = new ShadowGenerator(2048, sun);
    shadowGenerator.useExponentialShadowMap = true;
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.transparencyShadow = true;

    const ground = MeshBuilder.CreateGround("ground", { width: 300, height: 300 }, scene);
    ground.receiveShadows = true;
    ground.position.y = -2;

    const groundMaterial = new PBRMaterial("groundMaterial", scene);
    groundMaterial.metallic = 0;
    groundMaterial.roughness = 0.7;
    ground.material = groundMaterial;

    new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, restitution: 0, friction: 2 }, scene);

    const characters = await loadCharacters(scene, progressMonitor);
    const characterObject = characters.default.instantiateHierarchy(null);
    if (!(characterObject instanceof AbstractMesh)) {
        throw new Error("Character object is null");
    }

    const character = new CharacterControls(characterObject, scene);
    character.setThirdPersonCameraActive();
    character.getTransform().position = new Vector3(10, 0, -10);
    shadowGenerator.addShadowCaster(character.character);

    const tireTextures = await loadTireTextures(scene, progressMonitor);

    const rover = createWolfMk2(tireTextures, scene);

    rover.frame.physicsBody.disablePreStep = false;
    rover.frame.mesh.position.y = 5;

    camera.setTarget(rover.getTransform());
    shadowGenerator.addShadowCaster(rover.frame.mesh);

    const roverControls = new VehicleControls(scene);
    roverControls.setVehicle(rover);

    //spawn a bunch of boxes
    for (let i = 0; i < 200; i++) {
        const box = MeshBuilder.CreateBox(`box${i}`, { size: 0.2 + Math.random() }, scene);
        box.position = new Vector3((Math.random() - 0.5) * 200, 0, (Math.random() - 0.5) * 200);
        box.rotation = new Vector3(Math.random(), Math.random(), Math.random());
        shadowGenerator.addShadowCaster(box);

        const boxMaterial = new PBRMaterial("boxMaterial", scene);
        boxMaterial.albedoColor = Color3.Random();
        boxMaterial.metallic = 0;
        boxMaterial.roughness = 0.7;
        box.material = boxMaterial;

        new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: 50, restitution: 0.3, friction: 1 }, scene);
    }

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        character.update(deltaSeconds);
    });

    return scene;
}
