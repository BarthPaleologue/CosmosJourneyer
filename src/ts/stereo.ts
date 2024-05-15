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
import { EngineFactory } from "@babylonjs/core/Engines/engineFactory";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Misc/screenshotTools";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { BlackHolePostProcess } from "./stellarObjects/blackHole/blackHolePostProcess";
import { BlackHole } from "./stellarObjects/blackHole/blackHole";
import { Axis, Color4, HemisphericLight, MeshBuilder } from "@babylonjs/core";
import { translate } from "./uberCore/transforms/basicTransform";
import { Assets } from "./assets";
import { Mandelbulb } from "./anomalies/mandelbulb/mandelbulb";
import { MandelbulbPostProcess } from "./anomalies/mandelbulb/mandelbulbPostProcess";
import { StereoCameras } from "./utils/stereoCameras";
import { Scene } from "@babylonjs/core/scene";
import { JuliaSet } from "./anomalies/julia/juliaSet";
import { JuliaSetPostProcess } from "./anomalies/julia/juliaSetPostProcess";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.addEventListener(
    "click",
    (e) => {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
        if (canvas.requestPointerLock) {
            canvas.requestPointerLock();
        }
    },
    false
);

const engine = await EngineFactory.CreateAsync(canvas, {
    antialias: true
});
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const scene = new Scene(engine);
scene.useRightHandedSystem = true;
scene.clearColor = new Color4(0, 0, 0, 0);

await Assets.Init(scene);

const stereoCameras = new StereoCameras(scene);

const leftEye = stereoCameras.leftEye;
const rightEye = stereoCameras.rightEye;

scene.activeCameras = [leftEye, rightEye];

scene.enableDepthRenderer(leftEye, false, true);
scene.enableDepthRenderer(rightEye, false, true);

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
    mandelbulb.getTransform().scalingDeterminant = 1 / 5000e3;

    const mandelbulbPP = new MandelbulbPostProcess(mandelbulb, scene, []);
    leftEye.attachPostProcess(mandelbulbPP);
    rightEye.attachPostProcess(mandelbulbPP);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        mandelbulbPP.update(deltaSeconds);
    });

    return mandelbulb.getTransform();
}

function createJulia(): TransformNode {
    const julia = new JuliaSet("Julia", scene, Math.random() * 10000, null);
    julia.getTransform().scalingDeterminant = 1 / 5000e3;

    const juliaPP = new JuliaSetPostProcess(julia, scene, []);
    leftEye.attachPostProcess(juliaPP);
    rightEye.attachPostProcess(juliaPP);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        juliaPP.update(deltaSeconds);
    });

    return julia.getTransform();
}

let targetObject: TransformNode;

const urlParams = new URLSearchParams(window.location.search);
const sceneType = urlParams.get("scene");

if (sceneType === "mandelbulb") {
    targetObject = createMandelbulb();
} else if (sceneType === "julia") {
    targetObject = createJulia();
} else {
    targetObject = createMandelbulb();
}

const sun = new HemisphericLight("sun", new Vector3(0.5, 1, 0.5), scene);

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
        stereoCameras.getTransform().rotateAround(targetObject.getAbsolutePosition(), stereoCameras.getTransform().getDirection(Axis.X), -0.001 * mouseDY);

        applyFloatingOrigin();
    }
});

let ipdFactor = 1.0;
const defaultIPD = 0.065;
document.addEventListener("keydown", (e) => {
    if (e.key === "+") {
        ipdFactor += 0.1;
    } else if (e.key === "-") {
        ipdFactor -= 0.1;
    }
});

// Create WebSocket connection to retrieve the eye positions
const port = 4242;
const socket = new WebSocket(`ws://localhost:${port}`);

const leftEyePosition = Vector3.Zero();
const rightEyePosition = Vector3.Zero();

socket.addEventListener("open", () => {
    stereoCameras.setEyeTrackingEnabled(true);
});

socket.addEventListener("message", async (event) => {
    const blob = event.data as Blob;

    const buffer = await blob.arrayBuffer();
    const bufferView = new Float64Array(buffer);

    leftEyePosition.copyFromFloats(bufferView[0], bufferView[1], bufferView[2]).scaleInPlace(0.001);
    rightEyePosition.copyFromFloats(bufferView[3], bufferView[4], bufferView[5]).scaleInPlace(0.001);
});

scene.onBeforeRenderObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;

    stereoCameras.getTransform().rotateAround(targetObject.getAbsolutePosition(), Axis.X, 0.02 * deltaSeconds);
    stereoCameras.getTransform().computeWorldMatrix(true);
    stereoCameras.getTransform().rotateAround(targetObject.getAbsolutePosition(), Axis.Y, 0.1 * deltaSeconds);
    stereoCameras.getTransform().computeWorldMatrix(true);

    const eyeDistance = defaultIPD * ipdFactor;
    stereoCameras.setDefaultIPD(eyeDistance);

    const averageEyePosition = leftEyePosition.add(rightEyePosition).scaleInPlace(0.5);

    const trueEyeDistance = Math.abs(leftEyePosition.x - rightEyePosition.x);

    leftEyePosition.copyFrom(averageEyePosition.add(new Vector3(-trueEyeDistance * 0.5 * ipdFactor, 0, 0)));
    rightEyePosition.copyFrom(averageEyePosition.add(new Vector3(trueEyeDistance * 0.5 * ipdFactor, 0, 0)));
    stereoCameras.setEyeTrackingPositions(leftEyePosition, rightEyePosition);

    stereoCameras.updateCameraProjections();

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
