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
    DirectionalLight,
    HemisphericLight,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    Vector3,
    type AbstractEngine,
} from "@babylonjs/core";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadAsteroids } from "@/frontend/assets/objects/asteroids";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/helpers/transform";
import { AsteroidField } from "@/frontend/universe/asteroidFields/asteroidField";
import { AsteroidPatch } from "@/frontend/universe/asteroidFields/asteroidPatch";

import { enablePhysics } from "./utils";

export async function createAsteroidFieldScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const defaultControls = new DefaultControls(scene);

    const camera = defaultControls.getActiveCamera();
    camera.attachControl();

    scene.enableDepthRenderer(camera, false, true);

    const asteroids = await loadAsteroids(scene, progressMonitor);

    const directionalLight = new DirectionalLight("sun", new Vector3(1, -1, 0), scene);
    directionalLight.intensity = 0.7;

    const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);
    hemi.intensity = 0.4;

    const scalingFactor = 500;

    defaultControls.getTransform().position.z = -150 * scalingFactor;
    defaultControls.getTransform().position.y = 3 * scalingFactor;
    defaultControls.speed *= scalingFactor;
    camera.maxZ *= scalingFactor;

    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 20 * scalingFactor }, scene);

    new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, { mass: 0 }, scene);

    const beltRadius = 170 * scalingFactor;
    const beltSpread = 100 * scalingFactor;

    AsteroidPatch.BATCH_SIZE = 10_000;

    const belt = new AsteroidField(42, sphere, beltRadius - beltSpread / 2, beltRadius + beltRadius / 2, scene);

    const torus = MeshBuilder.CreateTorus(
        "torus",
        { diameter: 2 * beltRadius, thickness: 2 * beltSpread, tessellation: 32 },
        scene,
    );
    torus.visibility = 0.1;
    torus.parent = sphere;
    torus.scaling.y = 0.1 / scalingFactor;

    lookAt(defaultControls.getTransform(), sphere.position, scene.useRightHandedSystem);

    scene.onBeforeRenderObservable.add(() => {
        defaultControls.update(engine.getDeltaTime() / 1000);
        belt.update(defaultControls.getTransform().getAbsolutePosition(), asteroids, engine.getDeltaTime() / 1000);
    });

    return scene;
}
