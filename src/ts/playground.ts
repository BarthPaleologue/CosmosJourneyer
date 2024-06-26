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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Misc/screenshotTools";
import { Tools } from "@babylonjs/core/Misc/tools";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { DirectionalLight, HemisphericLight, MeshBuilder, Scene } from "@babylonjs/core";
import { Assets } from "./assets/assets";
import { DefaultControls } from "./defaultControls/defaultControls";
import { AsteroidBelt } from "./utils/asteroidBelt";

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

const beltRadius = 100;
const beltSpread = 20;

const belt = new AsteroidBelt(sphere, beltRadius, beltSpread);

const torus = MeshBuilder.CreateTorus("torus", { diameter: 2 * beltRadius, thickness: 2 * beltSpread, tessellation: 32 }, scene);
torus.visibility = 0.1;
torus.parent = sphere;

scene.onBeforeRenderObservable.add(() => {
    defaultControls.update(engine.getDeltaTime() / 1000);

    belt.update(defaultControls.getTransform().getAbsolutePosition());
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
