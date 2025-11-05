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
import { GravitySystem } from "@/frontend/universe/gravitySystem";

import { enablePhysics } from "./utils";

export async function createGravitySystemScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const sun = new DirectionalLight("sun", new Vector3(0.5, -1, -0.5), scene);
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

    const sphere1Radius = 10;

    const sphere1 = MeshBuilder.CreateSphere("ground", { diameter: sphere1Radius * 2 }, scene);
    sphere1.receiveShadows = true;

    const sphere2Radius = sphere1Radius / 3;
    const sphere2 = MeshBuilder.CreateSphere("sphere2", { diameter: sphere2Radius * 2 }, scene);
    sphere2.receiveShadows = true;
    sphere2.position.x = sphere1Radius * 4;

    const groundMaterial = new PBRMaterial("groundMaterial", scene);
    groundMaterial.albedoColor.set(0.8, 0.4, 0.2);
    groundMaterial.metallic = 0;
    groundMaterial.roughness = 0.7;

    sphere1.material = groundMaterial;
    sphere2.material = groundMaterial;

    new PhysicsAggregate(sphere1, PhysicsShapeType.SPHERE, { mass: 0, restitution: 0, friction: 2 }, scene);
    const sphere2Aggregate = new PhysicsAggregate(
        sphere2,
        PhysicsShapeType.SPHERE,
        { mass: 0, restitution: 0, friction: 2 },
        scene,
    );
    sphere2Aggregate.body.disablePreStep = false;

    const randomDirection = () => {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const x = Math.sin(phi) * Math.cos(theta);
        const y = Math.sin(phi) * Math.sin(theta);
        const z = Math.cos(phi);
        return new Vector3(x, y, z);
    };

    //spawn a bunch of boxes
    for (let i = 0; i < 200; i++) {
        const box = MeshBuilder.CreateBox(`box${i}`, { size: 0.2 + Math.random() }, scene);
        box.position = randomDirection().scaleInPlace(sphere1Radius + Math.random() * 40);
        box.rotation = new Vector3(Math.random(), Math.random(), Math.random());
        shadowGenerator.addShadowCaster(box);

        const boxMaterial = new PBRMaterial("boxMaterial", scene);
        boxMaterial.albedoColor = Color3.Random();
        boxMaterial.metallic = 0;
        boxMaterial.roughness = 0.7;
        box.material = boxMaterial;

        const boxAggregate = new PhysicsAggregate(
            box,
            PhysicsShapeType.BOX,
            { mass: 50, restitution: 0.3, friction: 1 },
            scene,
        );
        boxAggregate.body.applyImpulse(randomDirection().scale(1000 * Math.random()), box.position);
    }

    const camera = new ArcRotateCamera("Camera", Math.PI / 3, Math.PI / 3, sphere1Radius * 8, Vector3.Zero(), scene);
    camera.attachControl();

    const gravitySystem = new GravitySystem(scene);

    let elapsedSeconds = 0.0;
    const orbitalPeriod = 10;
    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        elapsedSeconds += deltaSeconds;

        sphere2.position.copyFromFloats(
            5 * sphere1Radius * Math.cos((2 * Math.PI * elapsedSeconds) / orbitalPeriod),
            5 * sphere1Radius * Math.sin((2 * Math.PI * elapsedSeconds) / orbitalPeriod),
            0,
        );

        gravitySystem.applyGravity([
            {
                name: "sphere1",
                mass: 1,
                radius: sphere1Radius,
                position: sphere1.position,
            },
            {
                name: "sphere2",
                mass: 1,
                radius: sphere2Radius,
                position: sphere2.position,
            },
        ]);
    });

    return scene;
}
