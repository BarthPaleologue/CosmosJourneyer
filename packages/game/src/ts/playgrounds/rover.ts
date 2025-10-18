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
    ArcRotateCamera,
    DirectionalLight,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    ShadowGenerator,
    Vector3,
    type AbstractEngine,
} from "@babylonjs/core";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { FilterMeshCollisions, VehicleBuilder } from "@/frontend/vehicle/vehicleBuilder";
import { VehicleControls } from "@/frontend/vehicle/vehicleControls";

import { createSky, enablePhysics } from "./utils";

export async function createRoverScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene, new Vector3(0, -9.81, 0));

    const camera = new ArcRotateCamera("camera", Math.PI / 2, -Math.PI / 3, 50, Vector3.Zero(), scene);
    camera.attachControl();

    const sun = new DirectionalLight("sun", new Vector3(0, -0.5, -1), scene);
    sun.autoUpdateExtends = true;

    createSky(sun.direction.scale(-1), scene);

    const shadowGenerator = new ShadowGenerator(2048, sun);
    shadowGenerator.useExponentialShadowMap = true;
    shadowGenerator.useBlurExponentialShadowMap = true;

    const ground = MeshBuilder.CreateGround("ground", { width: 300, height: 300 }, scene);
    ground.receiveShadows = true;
    ground.position.y = -2;

    new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, restitution: 0, friction: 2 }, scene);

    const rover = CreateRover(scene);
    camera.setTarget(rover.getTransform());
    shadowGenerator.addShadowCaster(rover.frame.mesh);

    const roverControls = new VehicleControls(scene);
    roverControls.setVehicle(rover);

    //spawn a bunch of boxes
    for (let i = 0; i < 50; i++) {
        const box = MeshBuilder.CreateBox(`box${i}`, { size: 4 }, scene);
        box.position = new Vector3((Math.random() - 0.5) * 200, 20 + Math.random() * 50, (Math.random() - 0.5) * 200);
        box.rotation = new Vector3(Math.random(), Math.random(), Math.random());
        shadowGenerator.addShadowCaster(box);

        new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: 50, restitution: 0.3, friction: 1 }, scene);
    }

    return Promise.resolve(scene);
}

function CreateRover(scene: Scene) {
    const carFrame = MeshBuilder.CreateBox("Frame", { height: 1, width: 12, depth: 24 });
    carFrame.position = new Vector3(0, 1, 0);
    const carAggregate = new PhysicsAggregate(carFrame, PhysicsShapeType.MESH, {
        mass: 2000,
        restitution: 0,
        friction: 0,
        center: new Vector3(0, -2.5, 0),
    });
    FilterMeshCollisions(carAggregate.shape);

    const wheelDistanceFromCenter = 7;

    const forwardLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, 8);
    const forwardRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, 8);
    const middleLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, 0);
    const middleRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, 0);
    const rearLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, -8);
    const rearRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, -8);

    const vehicleBuilder = new VehicleBuilder({
        mesh: carFrame,
        physicsBody: carAggregate.body,
        physicsShape: carAggregate.shape,
    });

    vehicleBuilder.addWheel(forwardLeftWheelPosition, true, true);
    vehicleBuilder.addWheel(forwardRightWheelPosition, true, true);
    vehicleBuilder.addWheel(middleLeftWheelPosition, true, false);
    vehicleBuilder.addWheel(middleRightWheelPosition, true, false);
    vehicleBuilder.addWheel(rearLeftWheelPosition, true, true);
    vehicleBuilder.addWheel(rearRightWheelPosition, true, true);

    const vehicle = vehicleBuilder.build(scene);

    carAggregate.body.disablePreStep = false;
    carFrame.position.y = 5;

    return vehicle;
}
