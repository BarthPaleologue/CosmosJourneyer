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

import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Misc/screenshotTools";
import { Tools } from "@babylonjs/core/Misc/tools";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { Scene } from "@babylonjs/core";
import { Assets } from "./assets";
import { DefaultControls } from "./defaultControls/defaultControls";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { SpaceStation } from "./proceduralAssets/spaceStation/spaceStation";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const scene = new Scene(engine);
scene.useRightHandedSystem = true;

/*const havokInstance = await HavokPhysics();
console.log(`Havok initialized`);
const havokPlugin = new HavokPlugin(true, havokInstance);
scene.enablePhysics(Vector3.Zero(), havokPlugin);*/

await Assets.Init(scene);

const defaultControls = new DefaultControls(scene);
defaultControls.speed = 2000;

const camera = defaultControls.getActiveCameras()[0];
camera.maxZ = 100e3;
camera.attachControl(canvas, true);

scene.enableDepthRenderer(camera, false, true);

defaultControls.getTransform().setAbsolutePosition(new Vector3(0, 2, -3).normalize().scaleInPlace(40e3));
defaultControls.getTransform().lookAt(Vector3.Zero());

//const starfieldPostProcess = new StarfieldPostProcess(scene, [], [], Quaternion.Identity());
//camera.attachPostProcess(starfieldPostProcess);

const spaceStation = new SpaceStation(scene);

const ambient = new HemisphericLight("Sun", Vector3.Up(), scene);
ambient.intensity = 0.4;

const sun = new DirectionalLight("Sun", new Vector3(1, -1, 1), scene);

scene.onBeforeRenderObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    defaultControls.update(deltaSeconds);

    spaceStation.update([], deltaSeconds);
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
