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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Misc/screenshotTools";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import {
    DirectionalLight,
    HemisphericLight,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene
} from "@babylonjs/core";
import { enablePhysics } from "./utils";
import { DefaultControls } from "../defaultControls/defaultControls";
import { loadObjects } from "../assets/objects";
import { loadTextures } from "../assets/textures";
import { initMaterials } from "../assets/materials";
import { AsteroidField } from "../asteroidFields/asteroidField";

export async function createAsteroidFieldScene(
    engine: Engine,
    progressCallback: (progress: number, text: string) => void
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const defaultControls = new DefaultControls(scene);

    const camera = defaultControls.getActiveCamera();
    camera.attachControl();

    scene.enableDepthRenderer(camera, false, true);

    const textures = await loadTextures((loadedCount, totalCount, name) => {
        progressCallback(loadedCount / totalCount, `Loading ${name}`);
    }, scene);

    const materials = initMaterials(textures, scene);

    const objects = await loadObjects(materials, textures, scene, () => {
        progressCallback(0, "Loading objects");
    });

    const directionalLight = new DirectionalLight("sun", new Vector3(1, -1, 0), scene);
    directionalLight.intensity = 0.7;

    const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);
    hemi.intensity = 0.4;

    const scalingFactor = 500;

    defaultControls.getTransform().position.z = -200 * scalingFactor;
    defaultControls.getTransform().position.y = 20 * scalingFactor;
    defaultControls.speed *= scalingFactor;
    camera.maxZ *= scalingFactor;

    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 20 * scalingFactor }, scene);

    const sphereAggregate = new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, { mass: 0 }, scene);

    const beltRadius = 100 * scalingFactor;
    const beltSpread = 20 * scalingFactor;

    const belt = new AsteroidField(42, sphere, beltRadius, beltSpread, scene);

    const torus = MeshBuilder.CreateTorus(
        "torus",
        { diameter: 2 * beltRadius, thickness: 2 * beltSpread, tessellation: 32 },
        scene
    );
    torus.visibility = 0.1;
    torus.parent = sphere;
    torus.scaling.y = 0.1 / scalingFactor;

    scene.onBeforeRenderObservable.add(() => {
        defaultControls.update(engine.getDeltaTime() / 1000);
        belt.update(defaultControls.getTransform().getAbsolutePosition(), objects, engine.getDeltaTime() / 1000);
    });

    return scene;
}
