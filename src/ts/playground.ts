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

import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";
import "../styles/index.scss";
import { Viewport } from "@babylonjs/core/Maths/math.viewport";
import "@babylonjs/core/Misc/screenshotTools";
import { Tools } from "@babylonjs/core/Misc/tools";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { BlackHolePostProcess } from "./postProcesses/blackHolePostProcess";
import { BlackHole } from "./stellarObjects/blackHole/blackHole";
import { UberScene } from "./uberCore/uberScene";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const scene = new UberScene(engine);
scene.useRightHandedSystem = true;

// This transform will be used as the parent of both eyes
const headTransform = new TransformNode("HeadTransform", scene);

// Fine tune this value with your own eyes
const interOcularDistance = 0.065 / 2;

// left eye is on the left
const leftEye = new FreeCamera("LeftEye", new Vector3(-interOcularDistance / 2, 0, 0), scene);
leftEye.viewport = new Viewport(0, 0.0, 0.5, 1);
leftEye.parent = headTransform;
leftEye.maxZ = 20000e3;

// right eye is on the right
const rightEye = new FreeCamera("RightEye", new Vector3(interOcularDistance / 2, 0, 0), scene);
rightEye.viewport = new Viewport(0.5, 0, 0.5, 1);
rightEye.parent = headTransform;
rightEye.maxZ = 20000e3;

// this shrinks the resulting images horizontally. Useful for autostereoscopic displays
headTransform.scaling.x = 2;

const debugCamera = new FreeCamera("DebugCamera", Vector3.Zero(), scene);
debugCamera.maxZ = 50_000e3;
debugCamera.attachControl(true);

scene.activeCameras = [leftEye, rightEye];
//scene.activeCamera = debugCamera;
scene.setActiveCamera(leftEye);

const blackHole = new BlackHole("hole", scene, 0, null);
blackHole.getTransform().setAbsolutePosition(new Vector3(0, 0, 20000e3));

const bh = new BlackHolePostProcess(blackHole, scene, Quaternion.Identity());
leftEye.attachPostProcess(bh);
rightEye.attachPostProcess(bh);

// our eyes will focus on the center where the object is
const focalPoint = blackHole.getTransform().getAbsolutePosition();

// because our eyes are in the local space of the head, we must translate the focal point in that local space to be able to use it
const headInverseWorld = headTransform.computeWorldMatrix(true).clone().invert();
const focalPointLocalSpace = Vector3.TransformCoordinates(focalPoint, headInverseWorld); 

// we turn our eyes to the target in local space
leftEye.setTarget(focalPointLocalSpace);
rightEye.setTarget(focalPointLocalSpace);

scene.onBeforeRenderObservable.add(() => {
    bh.update(engine.getDeltaTime() / 1000);
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
        Tools.CreateScreenshot(engine, leftEye, { precision: 1 });
        Tools.CreateScreenshot(engine, rightEye, { precision: 1 });
    }
});
