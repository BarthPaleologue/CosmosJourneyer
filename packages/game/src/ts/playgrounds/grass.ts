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

import { FreeCamera, MeshBuilder, PointLight, Vector3 } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { seededSquirrelNoise } from "squirrel-noise";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { createGrassBlade } from "@/frontend/assets/procedural/grass/grassBlade";
import { GrassMaterial } from "@/frontend/assets/procedural/grass/grassMaterial";
import { loadTextures } from "@/frontend/assets/textures";
import { createSquareMatrixBuffer } from "@/frontend/universe/planets/telluricPlanet/terrain/instancePatch/matrixBuffer";
import { ThinInstancePatch } from "@/frontend/universe/planets/telluricPlanet/terrain/instancePatch/thinInstancePatch";

import { createSky } from "./utils";

export async function createGrassScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);

    const textures = await loadTextures(scene, progressMonitor);

    // This creates and positions a free camera (non-mesh)
    const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl();

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new PointLight("light1", new Vector3(200, 800, 100), scene);
    const lightSphere = MeshBuilder.CreateSphere(
        "lightSphere",
        {
            diameter: 0.1,
            segments: 8,
        },
        scene,
    );
    lightSphere.position = light.position;

    createSky(light.position, scene);

    const ground = MeshBuilder.CreateGround(
        "ground",
        {
            width: 32,
            height: 32,
            subdivisions: 4,
        },
        scene,
    );
    ground.setEnabled(false);

    const grassBladeMesh = createGrassBlade(scene, 5);
    grassBladeMesh.isVisible = false;

    const grassMaterial = new GrassMaterial(scene, textures.noises, false);
    grassMaterial.setPlanet(ground);
    grassBladeMesh.material = grassMaterial;

    const rng = seededSquirrelNoise(0);
    let rngState = 0;
    const wrappedRng = () => {
        return rng(rngState++);
    };

    const grassPatch = new ThinInstancePatch(createSquareMatrixBuffer(Vector3.Zero(), 32, 256, wrappedRng));
    grassPatch.createInstances([{ mesh: grassBladeMesh, distance: 0 }]);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        grassMaterial.update([light], new Vector3(0, 10, 0), deltaSeconds);
    });

    return scene;
}
