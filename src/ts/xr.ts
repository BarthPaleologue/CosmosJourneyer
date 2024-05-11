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

import { Assets } from "./assets";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Mandelbulb } from "./mandelbulb/mandelbulb";
import { MandelbulbPostProcess } from "./postProcesses/mandelbulbPostProcess";
import "@babylonjs/core";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const scene = new Scene(engine);
scene.useRightHandedSystem = true;

const fallbackCamera = new FreeCamera("FallbackCamera", new Vector3(0, 0, 0), scene);
fallbackCamera.attachControl(canvas, true);
scene.enableDepthRenderer(fallbackCamera, false, true);

await Assets.Init(scene);

const xr = await scene.createDefaultXRExperienceAsync();
if (!xr.baseExperience) {
    // no xr support
    throw new Error("No XR support");
} else {
    // all good, ready to go
    console.log("XR support");
}

const webXRInput = xr.input; // if using the experience helper, otherwise, an instance of WebXRInput
webXRInput.onControllerAddedObservable.add((xrController) => {
    console.log("Controller added");
    xrController.onMotionControllerInitObservable.add((motionController) => {
        console.log("Motion controller initialized");

        const mainComponent = motionController.getMainComponent();

        mainComponent.onButtonStateChangedObservable.add((component) => {
            if (component.changes.pressed) {
                if (component.changes.pressed.current) {
                    console.log("Pressed");
                }
                if (component.pressed) {
                    console.log("Pressed");
                }
            }
        });
    });
});

const xrCamera = xr.baseExperience.camera;
xrCamera.rigCameras.forEach((camera) => {
    scene.enableDepthRenderer(camera, false, true);
});

const starfieldPostProcess = new StarfieldPostProcess(scene, [], [], Quaternion.Identity());
fallbackCamera.attachPostProcess(starfieldPostProcess);
xrCamera.attachPostProcess(starfieldPostProcess);

function createMandelbulb(): TransformNode {
    const mandelbulb = new Mandelbulb("bulb", scene, Math.random() * 10000, null);
    mandelbulb.getTransform().setAbsolutePosition(new Vector3(0, 0, 15));
    mandelbulb.getTransform().scalingDeterminant = 1 / 100e3;

    const mandelbulbPP = new MandelbulbPostProcess(mandelbulb, scene, []);
    fallbackCamera.attachPostProcess(mandelbulbPP);
    xrCamera.attachPostProcess(mandelbulbPP);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        mandelbulbPP.update(deltaSeconds);
    });

    return mandelbulb.getTransform();
}

createMandelbulb();

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
