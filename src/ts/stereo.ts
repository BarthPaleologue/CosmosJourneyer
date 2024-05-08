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
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { Axis, MeshBuilder, Scene } from "@babylonjs/core";
import { translate } from "./uberCore/transforms/basicTransform";
import { Assets } from "./assets";
import { Mandelbulb } from "./mandelbulb/mandelbulb";
import { MandelbulbPostProcess } from "./postProcesses/mandelbulbPostProcess";

const FOV = Tools.ToRadians(60);

// Fine tune this value with your own eyes
const interOcularDistance = 0.065;

export class StereoCameras {
    readonly transform: TransformNode;

    readonly leftEye: FreeCamera;
    readonly rightEye: FreeCamera;

    constructor(canvas: HTMLCanvasElement, engine: Engine, scene: Scene) {
        // This transform will be used as the parent of both eyes
        this.transform = new TransformNode("HeadTransform", scene);

        // left eye is on the left
        this.leftEye = new FreeCamera("LeftEye", new Vector3(-interOcularDistance / 2, 0, 0), scene);
        this.leftEye.fov = FOV;
        this.leftEye.viewport = new Viewport(0, 0.0, 0.5, 1);
        this.leftEye.parent = this.transform;
        this.leftEye.onProjectionMatrixChangedObservable.add(() => {
            const aspectRatio = canvas.width / canvas.height;
            this.leftEye._projectionMatrix.copyFrom(Matrix.PerspectiveFovLH(this.leftEye.fov, aspectRatio, this.leftEye.minZ, this.leftEye.maxZ, engine.isNDCHalfZRange, this.leftEye.projectionPlaneTilt, engine.useReverseDepthBuffer));
        });

        // right eye is on the right
        this.rightEye = new FreeCamera("RightEye", new Vector3(interOcularDistance / 2, 0, 0), scene);
        this.rightEye.fov = FOV;
        this.rightEye.viewport = new Viewport(0.5, 0, 0.5, 1);
        this.rightEye.parent = this.transform;
        this.rightEye.onProjectionMatrixChangedObservable.add(() => {
            const aspectRatio = canvas.width / canvas.height;
            this.rightEye._projectionMatrix.copyFrom(Matrix.PerspectiveFovLH(this.rightEye.fov, aspectRatio, this.rightEye.minZ, this.rightEye.maxZ, engine.isNDCHalfZRange, this.rightEye.projectionPlaneTilt, engine.useReverseDepthBuffer));
        });
    }

    /**
     * Make the left and right eyes look at the focal point
     * @param focalPoint The focal point in world space
     */
    focusOnPoint(focalPoint: Vector3) {
        this.transform.lookAt(focalPoint);

        // look forward
        this.leftEye.setTarget(this.leftEye.position.add(Axis.Z.scale(10_000)));
        this.rightEye.setTarget(this.rightEye.position.add(Axis.Z.scale(10_000)));
    }
}

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const scene = new UberScene(engine);
scene.useRightHandedSystem = true;

await Assets.Init(scene);

const stereoCameras = new StereoCameras(canvas, engine, scene);  

const leftEye = stereoCameras.leftEye
const rightEye = stereoCameras.rightEye;

scene.activeCameras = [leftEye, rightEye];

scene.setActiveCamera(leftEye);
leftEye.detachControl();
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

stereoCameras.transform.rotateAround(targetObject.getAbsolutePosition(), Axis.X, 0.2);

function applyFloatingOrigin() {
    const headPosition = stereoCameras.transform.getAbsolutePosition().clone();

    translate(stereoCameras.transform, headPosition.negate());
    translate(targetObject, headPosition.negate());
}

let mousePressed = false;
document.addEventListener("pointerdown", () => mousePressed = true);
document.addEventListener("pointerup", () => mousePressed = false);

document.addEventListener("pointermove", e => {
    const mouseDX = e.movementX;
    const mouseDY = e.movementY;

    if(mousePressed) {
        stereoCameras.transform.rotateAround(targetObject.getAbsolutePosition(), Axis.Y, 0.001 * mouseDX);
        stereoCameras.transform.computeWorldMatrix(true);
        stereoCameras.transform.rotateAround(targetObject.getAbsolutePosition(), stereoCameras.transform.getDirection(Axis.X), -0.001 * mouseDY);
        stereoCameras.transform.computeWorldMatrix(true);

        applyFloatingOrigin();
    }
});

let interOcularFactor = 1; // empirical value
document.addEventListener("keydown", e => {
    if(e.repeat) return;
    if(e.key === "ArrowDown") {
        interOcularFactor /= 1.5;
    } else if(e.key === "ArrowUp") {
        interOcularFactor *= 1.5;
    }
    console.log(interOcularFactor);
});

scene.onBeforeRenderObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;

    // our eyes will focus on the center where the object is
    const focalPoint = targetObject.getAbsolutePosition().negate();

    stereoCameras.leftEye.position.x = -interOcularDistance * 0.5 * interOcularFactor;
    stereoCameras.rightEye.position.x = interOcularDistance * 0.5 * interOcularFactor;
    
    stereoCameras.focusOnPoint(focalPoint);

    stereoCameras.transform.rotateAround(targetObject.getAbsolutePosition(), Axis.X, 0.02 * deltaSeconds);
    stereoCameras.transform.computeWorldMatrix(true);
    stereoCameras.transform.rotateAround(targetObject.getAbsolutePosition(), Axis.Y, 0.1 * deltaSeconds);
    stereoCameras.transform.computeWorldMatrix(true);

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

document.addEventListener("keypress", (e) => {
    if (e.key === "p") {
        // take screenshot
        Tools.CreateScreenshot(engine, leftEye, { precision: 1 });
        Tools.CreateScreenshot(engine, rightEye, { precision: 1 });
    }
});