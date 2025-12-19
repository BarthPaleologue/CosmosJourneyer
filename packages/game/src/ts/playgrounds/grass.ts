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
    HemisphericLight,
    MeshBuilder,
    PBRMaterial,
    Vector3,
} from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { seededSquirrelNoise } from "squirrel-noise";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { createGrassBlade } from "@/frontend/assets/procedural/grass/grassBlade";
import { GrassMaterial } from "@/frontend/assets/procedural/grass/grassMaterial";
import { loadNoiseTextures } from "@/frontend/assets/textures/noises";
import { createSquareMatrixBuffer } from "@/frontend/universe/planets/telluricPlanet/terrain/instancePatch/matrixBuffer";
import { ThinInstancePatch } from "@/frontend/universe/planets/telluricPlanet/terrain/instancePatch/thinInstancePatch";

import { createSky } from "./utils";

export async function createGrassScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const camera = new ArcRotateCamera("camera1", 0, (0.9 * Math.PI) / 2, 10, new Vector3(0, 0.5, 0), scene);
    camera.upperBetaLimit = Math.PI / 2;
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 100;
    camera.attachControl();

    const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);
    light.position = new Vector3(5, 5, 5).scaleInPlace(10);

    createSky(light.direction.scale(-1), scene);

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;

    const ground = MeshBuilder.CreateGround(
        "ground",
        {
            width: 32,
            height: 32,
            subdivisions: 4,
        },
        scene,
    );

    const groundMaterial = new PBRMaterial("groundMaterial", scene);
    groundMaterial.albedoColor = Color3.FromHexString("#0C4909").scale(0.5);
    groundMaterial.metallic = 0.0;
    groundMaterial.roughness = 0.8;
    ground.material = groundMaterial;

    const grassBladeMesh = createGrassBlade(scene, 5);
    grassBladeMesh.isVisible = false;

    const noiseTextures = await loadNoiseTextures(scene, progressMonitor);
    const grassMaterial = new GrassMaterial(noiseTextures.seamlessPerlin, scene);
    grassBladeMesh.material = grassMaterial.get();

    const rng = seededSquirrelNoise(0);
    let rngState = 0;
    const wrappedRng = () => {
        return rng(rngState++);
    };

    const grassPatch = new ThinInstancePatch(createSquareMatrixBuffer(Vector3.Zero(), 32, 256, wrappedRng));
    grassPatch.createInstances([{ mesh: grassBladeMesh, distance: 0 }]);
    grassPatch.getCurrentMesh().parent = ground;

    return scene;
}
