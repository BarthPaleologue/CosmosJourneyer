
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
import { DefaultControls } from "./defaultControls/defaultControls";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Assets } from "./assets/assets";
import HavokPhysics from "@babylonjs/havok";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Star } from "./stellarObjects/star/star";
import { Settings } from "./settings";
import { LandingPad } from "./assets/procedural/landingPad/landingPad";
import { Spaceship } from "./spaceship/spaceship";
import { PhysicsViewer } from "@babylonjs/core/Debug/physicsViewer";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const scene = new Scene(engine);
scene.useRightHandedSystem = true;

const havokInstance = await HavokPhysics();
console.log(`Havok initialized`);
const havokPlugin = new HavokPlugin(true, havokInstance);
scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);

await Assets.Init(scene);

const defaultControls = new DefaultControls(scene);
defaultControls.speed = 10;

const camera = defaultControls.getActiveCameras()[0];
camera.minZ = 0.1;
camera.maxZ = 100e3;
camera.attachControl(canvas, true);

scene.enableDepthRenderer(camera, false, true);

const distanceToStar = 25000 * Settings.EARTH_RADIUS;

defaultControls.getTransform().setAbsolutePosition(new Vector3(0, 2, -3).normalize().scaleInPlace(20));
defaultControls.getTransform().lookAt(Vector3.Zero());

const sun = new Star("Sun", scene, 4413.641464990006);
sun.getTransform().position = new Vector3(1, 2, 1).normalize().scaleInPlace(distanceToStar);

const spaceShip = new Spaceship(scene);
spaceShip.getTransform().position.y = 2;

const landingPad = new LandingPad(Math.floor(Math.random() * 50), scene);

let elapsedSeconds = 0;
scene.onBeforePhysicsObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    elapsedSeconds += deltaSeconds;

    landingPad.update([sun]);

    defaultControls.update(deltaSeconds);
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    engine.runRenderLoop(() => {
        scene.render();
    });
});

/*const physicsViewer = new PhysicsViewer(scene);
scene.meshes.forEach((mesh) => {
   if(mesh.physicsBody) physicsViewer.showBody(mesh.physicsBody);
});*/

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
