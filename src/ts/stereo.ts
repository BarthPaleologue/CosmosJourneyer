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
import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Misc/screenshotTools";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { BlackHolePostProcess } from "./stellarObjects/blackHole/blackHolePostProcess";
import { BlackHole } from "./stellarObjects/blackHole/blackHole";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { Axis } from "@babylonjs/core";
import { translate } from "./uberCore/transforms/basicTransform";
import { Assets } from "./assets";
import { Mandelbulb } from "./mandelbulb/mandelbulb";
import { MandelbulbPostProcess } from "./mandelbulb/mandelbulbPostProcess";
import { StereoCameras } from "./utils/stereoCameras";
import { Scene } from "@babylonjs/core/scene";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const scene = new Scene(engine);
scene.useRightHandedSystem = true;

await Assets.Init(scene);

const stereoCameras = new StereoCameras(canvas, engine, scene);

const leftEye = stereoCameras.leftEye;
const rightEye = stereoCameras.rightEye;

scene.activeCameras = [leftEye, rightEye];

scene.enableDepthRenderer(leftEye, false, true);
scene.enableDepthRenderer(rightEye, false, true);

const starfieldPostProcess = new StarfieldPostProcess(scene, [], [], Quaternion.Identity());
leftEye.attachPostProcess(starfieldPostProcess);
rightEye.attachPostProcess(starfieldPostProcess);

function createBlackHole(): TransformNode {
    const blackHole = new BlackHole("hole", scene, 0, null);
    blackHole.getTransform().setAbsolutePosition(new Vector3(0, 0, 15));
    blackHole.getTransform().scalingDeterminant = 1 / 100e3;

    const blackHolePP = new BlackHolePostProcess(blackHole, scene, Quaternion.Identity());
    leftEye.attachPostProcess(blackHolePP);
    rightEye.attachPostProcess(blackHolePP);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        blackHolePP.update(deltaSeconds);
    });

    return blackHole.getTransform();
}

function createMandelbulb(): TransformNode {
    const mandelbulb = new Mandelbulb("bulb", scene, Math.random() * 10000, null);
    mandelbulb.getTransform().setAbsolutePosition(new Vector3(0, 0, 15));
    mandelbulb.getTransform().scalingDeterminant = 1 / 100e3;

    const mandelbulbPP = new MandelbulbPostProcess(mandelbulb, scene, []);
    leftEye.attachPostProcess(mandelbulbPP);
    rightEye.attachPostProcess(mandelbulbPP);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        mandelbulbPP.update(deltaSeconds);
    });

    return mandelbulb.getTransform();
}

const targetObject = createMandelbulb();

stereoCameras.getTransform().rotateAround(targetObject.getAbsolutePosition(), Axis.X, 0.2);

function applyFloatingOrigin() {
    const headPosition = stereoCameras.getTransform().getAbsolutePosition().clone();

    translate(stereoCameras.getTransform(), headPosition.negate());
    translate(targetObject, headPosition.negate());
}

let mousePressed = false;
document.addEventListener("pointerdown", () => (mousePressed = true));
document.addEventListener("pointerup", () => (mousePressed = false));

document.addEventListener("pointermove", (e) => {
    const mouseDX = e.movementX;
    const mouseDY = e.movementY;

    if (mousePressed) {
        stereoCameras.getTransform().rotateAround(targetObject.getAbsolutePosition(), Axis.Y, 0.001 * mouseDX);
        stereoCameras.getTransform().computeWorldMatrix(true);
        stereoCameras.getTransform().rotateAround(targetObject.getAbsolutePosition(), stereoCameras.getTransform().getDirection(Axis.X), -0.001 * mouseDY);
        stereoCameras.getTransform().computeWorldMatrix(true);

        applyFloatingOrigin();
    }
});

scene.onBeforeRenderObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;

    // our eyes will focus on the center where the object is
    const focalPoint = targetObject.getAbsolutePosition().negate();

    stereoCameras.getTransform().lookAt(focalPoint);

    stereoCameras.getTransform().rotateAround(targetObject.getAbsolutePosition(), Axis.X, 0.02 * deltaSeconds);
    stereoCameras.getTransform().computeWorldMatrix(true);
    stereoCameras.getTransform().rotateAround(targetObject.getAbsolutePosition(), Axis.Y, 0.1 * deltaSeconds);
    stereoCameras.getTransform().computeWorldMatrix(true);

    applyFloatingOrigin();
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
