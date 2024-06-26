//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import "../styles/index.scss";

import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Misc/screenshotTools";
import { Tools } from "@babylonjs/core/Misc/tools";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { BlackHolePostProcess } from "./stellarObjects/blackHole/blackHolePostProcess";
import { BlackHole } from "./stellarObjects/blackHole/blackHole";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { Axis, DirectionalLight, HemisphericLight, MeshBuilder, Scene } from "@babylonjs/core";
import { translate } from "./uberCore/transforms/basicTransform";
import { Assets } from "./assets/assets";
import { DefaultControls } from "./defaultControls/defaultControls";
import { InstancePatch } from "./planets/telluricPlanet/terrain/instancePatch/instancePatch";
import { Objects } from "./assets/objects";
import { IPatch } from "./planets/telluricPlanet/terrain/instancePatch/iPatch";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const scene = new Scene(engine);
scene.useRightHandedSystem = true;

const defaultControls = new DefaultControls(scene);

defaultControls.getTransform().position.z = -200;
defaultControls.getTransform().position.y = 20;

const camera = defaultControls.getActiveCameras()[0];
camera.attachControl(canvas, true);

scene.enableDepthRenderer(camera, false, true);

await Assets.Init(scene);

const directionalLight = new DirectionalLight("sun", new Vector3(1, -1, 0), scene);
directionalLight.intensity = 0.7;

const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);
hemi.intensity = 0.4;

const sphere = MeshBuilder.CreateSphere("box", { diameter: 20 }, scene);

const torus = MeshBuilder.CreateTorus("torus", { diameter: 100, thickness: 10, tessellation: 32 }, scene);
torus.visibility = 0.1;
torus.parent = sphere;

const resolution = 4;
const patchSize = 5;

function squareBuffer(position: Vector3): Float32Array {
    const matrixBuffer = new Float32Array(resolution * resolution * 16);
    const cellSize = patchSize / resolution;
    let index = 0;
    for (let x = 0; x < resolution; x++) {
        for (let z = 0; z < resolution; z++) {
            const randomCellPositionX = Math.random() * cellSize;
            const randomCellPositionZ = Math.random() * cellSize;
            const positionX = position.x + x * cellSize - patchSize / 2 + randomCellPositionX;
            const positionZ = position.z + z * cellSize - patchSize / 2 + randomCellPositionZ;
            const positionY = (Math.random() - 0.5) * 3.0;
            const scaling = 0.7 + Math.random() * 0.6;

            const matrix = Matrix.Compose(
                new Vector3(scaling, scaling, scaling),
                Quaternion.RotationAxis(Vector3.Up(), Math.random() * 2 * Math.PI),
                new Vector3(positionX, positionY, positionZ)
            );
            matrix.copyToArray(matrixBuffer, 16 * index);

            index += 1;
        }
    }

    return matrixBuffer;
}

const beltMinRadius = 45;
const beltMaxRadius = 55;

const patches = new Map<string, { patch: IPatch, cell: [number, number] }>();

scene.onBeforeRenderObservable.add(() => {
    defaultControls.update(engine.getDeltaTime() / 1000);

    const maxRadius = 3;

    const cameraCellX = Math.round(defaultControls.getTransform().position.x / patchSize);
    const cameraCellZ = Math.round(defaultControls.getTransform().position.z / patchSize);

    // remove patches too far away
    for (const [key, value] of patches) {
        const [patchCellX, patchCellZ] = value.cell;
        const patch = value.patch;

        if ((cameraCellX - patchCellX) ** 2 + (cameraCellZ - patchCellZ) ** 2 >= maxRadius * maxRadius) {
            patch.clearInstances();
            patch.dispose();

            patches.delete(key);
        }
    }

    // create new patches
    for (let x = -maxRadius; x <= maxRadius; x++) {
        for (let z = -maxRadius; z <= maxRadius; z++) {
            const cellX = cameraCellX + x;
            const cellZ = cameraCellZ + z;

            const radiusSquared = (cellX * patchSize) ** 2 + (cellZ * patchSize) ** 2;
            if (radiusSquared < beltMinRadius * beltMinRadius || radiusSquared > beltMaxRadius * beltMaxRadius) continue;

            if (patches.has(`${cellX};${cellZ}`)) continue;

            if ((cameraCellX - cellX) ** 2 + (cameraCellZ - cellZ) ** 2 >= maxRadius * maxRadius) continue;

            const matrixBuffer = squareBuffer(new Vector3(cellX * patchSize, 0, cellZ * patchSize));
            const patch = new InstancePatch(sphere, matrixBuffer);
            patch.createInstances(Objects.ROCK);

            patches.set(`${cellX};${cellZ}`, { patch: patch, cell: [cellX, cellZ] });
        }
    }
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    engine.runRenderLoop(() => {
        scene.render();
    });
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize(true);
});

document.addEventListener("keypress", (e) => {
    if (e.key === "p") {
        // take screenshot
        Tools.CreateScreenshot(engine, camera, { precision: 1 });
    }
});
