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
import { Tools } from "@babylonjs/core/Misc/tools";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { BlackHolePostProcess } from "./postProcesses/blackHolePostProcess";
import { BlackHole } from "./stellarObjects/blackHole/blackHole";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { Axis, Scene } from "@babylonjs/core";
import { translate } from "./uberCore/transforms/basicTransform";
import { Assets } from "./assets";
import { DefaultControls } from "./defaultController/defaultControls";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const scene = new Scene(engine);
scene.useRightHandedSystem = true;

const defaultControls = new DefaultControls(scene);
defaultControls.speed = 4_000_000;

const camera = defaultControls.getActiveCameras()[0];
camera.maxZ = 100_000e3;
camera.attachControl(canvas, true);

scene.enableDepthRenderer(camera, false, true);

await Assets.Init(scene);

const starfieldPostProcess = new StarfieldPostProcess(scene, [], [], Quaternion.Identity());
camera.attachPostProcess(starfieldPostProcess);

function createBlackHole(): TransformNode {
    const blackHole = new BlackHole("hole", scene, 0, null);
    blackHole.getTransform().setAbsolutePosition(new Vector3(0, 0, 15000e3));

    const blackHolePP = new BlackHolePostProcess(blackHole, scene, Quaternion.Identity());
    camera.attachPostProcess(blackHolePP);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        blackHolePP.update(deltaSeconds);
    });

    return blackHole.getTransform();
}

const targetObject = createBlackHole();

defaultControls.getTransform().rotateAround(targetObject.getAbsolutePosition(), Axis.X, 0.2);

function applyFloatingOrigin() {
    const playerPosition = defaultControls.getTransform().getAbsolutePosition().clone();

    translate(defaultControls.getTransform(), playerPosition.negate());
    translate(targetObject, playerPosition.negate());
}

scene.onBeforeRenderObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;

    defaultControls.update(deltaSeconds);

    defaultControls.getTransform().lookAt(targetObject.getAbsolutePosition());

    defaultControls.getTransform().rotateAround(targetObject.getAbsolutePosition(), Axis.X, 0.02 * deltaSeconds);
    defaultControls.getTransform().computeWorldMatrix(true);
    defaultControls.getTransform().rotateAround(targetObject.getAbsolutePosition(), Axis.Y, 0.1 * deltaSeconds);
    defaultControls.getTransform().computeWorldMatrix(true);

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
        Tools.CreateScreenshot(engine, camera, { precision: 1 });
    }
});
