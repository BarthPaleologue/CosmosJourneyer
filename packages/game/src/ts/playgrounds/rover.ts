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
    Texture,
    Vector3,
    type AbstractEngine,
} from "@babylonjs/core";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadCharacters } from "@/frontend/assets/objects/characters";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { TireMaterial } from "@/frontend/vehicle/tireMaterial";
import { FilterMeshCollisions, VehicleBuilder } from "@/frontend/vehicle/vehicleBuilder";
import { VehicleControls } from "@/frontend/vehicle/vehicleControls";

import { enablePhysics } from "./utils";

import tireAOPath from "@assets/metal_0054_2k_b3OPPy/metal_0054_ao_2k.jpg";
import tireAlbedoPath from "@assets/metal_0054_2k_b3OPPy/metal_0054_color_2k.jpg";
import tireMetallicPath from "@assets/metal_0054_2k_b3OPPy/metal_0054_metallic_2k.jpg";
import tireNormalPath from "@assets/metal_0054_2k_b3OPPy/metal_0054_normal_direct_2k.png";
import tireOpacityPath from "@assets/metal_0054_2k_b3OPPy/metal_0054_opacity_2k.jpg";
import tireRoughnessPath from "@assets/metal_0054_2k_b3OPPy/metal_0054_roughness_2k.jpg";

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

    const carFrame = MeshBuilder.CreateBox("Frame", { height: 0.2, width: 4, depth: 9 });
    carFrame.position = new Vector3(0, 0.8, 0);
    const carAggregate = new PhysicsAggregate(carFrame, PhysicsShapeType.MESH, {
        mass: 2000,
        restitution: 0,
        friction: 0,
        center: new Vector3(0, -2.5, 0),
    });
    FilterMeshCollisions(carAggregate.shape);

    const wheelDistanceFromCenter = 2.5;

    const forwardLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, 3);
    const forwardRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, 3);
    const middleLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, 0);
    const middleRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, 0);
    const rearLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, -3);
    const rearRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, -3);

    const vehicleBuilder = new VehicleBuilder({
        mesh: carFrame,
        physicsBody: carAggregate.body,
        physicsShape: carAggregate.shape,
    });

    const wheelRadius = 0.7;

    vehicleBuilder.addWheel(forwardLeftWheelPosition, wheelRadius, true, true);
    vehicleBuilder.addWheel(forwardRightWheelPosition, wheelRadius, true, true);
    vehicleBuilder.addWheel(middleLeftWheelPosition, wheelRadius, true, false);
    vehicleBuilder.addWheel(middleRightWheelPosition, wheelRadius, true, false);
    vehicleBuilder.addWheel(rearLeftWheelPosition, wheelRadius, true, true);
    vehicleBuilder.addWheel(rearRightWheelPosition, wheelRadius, true, true);

    const tireMaterial = new TireMaterial(
        {
            albedo: new Texture(tireAlbedoPath, scene),
            normal: new Texture(tireNormalPath, scene),
            roughness: new Texture(tireRoughnessPath, scene),
            metallic: new Texture(tireMetallicPath, scene),
            ambientOcclusion: new Texture(tireAOPath, scene),
            opacity: new Texture(tireOpacityPath, scene),
        },
        scene,
    );

    const rover = vehicleBuilder.build({ tireMaterial: tireMaterial.get() }, scene);

    carAggregate.body.disablePreStep = false;
    carFrame.position.y = 5;

    camera.setTarget(rover.getTransform());
    shadowGenerator.addShadowCaster(rover.frame.mesh);

    const roverControls = new VehicleControls(scene);
    roverControls.setVehicle(rover);

    //spawn a bunch of boxes
    for (let i = 0; i < 200; i++) {
        const box = MeshBuilder.CreateBox(`box${i}`, { size: 2 * Math.random() }, scene);
        box.position = new Vector3((Math.random() - 0.5) * 200, 20 + Math.random() * 50, (Math.random() - 0.5) * 200);
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
