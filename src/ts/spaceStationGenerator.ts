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
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { Assets } from "./assets/assets";
import { SpaceStation } from "./spacestation/spaceStation";
import HavokPhysics from "@babylonjs/havok";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Star } from "./stellarObjects/star/star";
import { Settings } from "./settings";
import { SpaceStationModel } from "./spacestation/spacestationModel";

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
scene.enablePhysics(Vector3.Zero(), havokPlugin);

await Assets.Init(scene);

const defaultControls = new DefaultControls(scene);
defaultControls.speed = 2000;

const camera = defaultControls.getActiveCameras()[0];
camera.maxZ = 100e3;
camera.attachControl(canvas, true);

scene.enableDepthRenderer(camera, false, true);

const distanceToStar = 25000 * Settings.EARTH_RADIUS;

defaultControls.getTransform().setAbsolutePosition(new Vector3(0, 2, -3).normalize().scaleInPlace(40e3));
defaultControls.getTransform().lookAt(Vector3.Zero());

const sun = new Star("Sun", scene, 4413.641464990006);
sun.getTransform().position = new Vector3(7, 2, 5).normalize().scaleInPlace(distanceToStar);

const starfieldPostProcess = new StarfieldPostProcess(scene, [sun], [], Quaternion.Identity());
camera.attachPostProcess(starfieldPostProcess);

const spaceStationModel = new SpaceStationModel(42, sun.model);
spaceStationModel.orbit.radius = distanceToStar;

const spaceStation = new SpaceStation(scene, spaceStationModel, sun);

const ambient = new HemisphericLight("Sun", Vector3.Up(), scene);
ambient.intensity = 0.1;


let elapsedSeconds = 0;
scene.onBeforePhysicsObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    elapsedSeconds += deltaSeconds;

    defaultControls.update(deltaSeconds);

    //const controlsPosition = defaultControls.getTransform().getAbsolutePosition().clone();
    //translate(spaceStation.getTransform(), controlsPosition.negate());
    //translate(sun.getTransform(), controlsPosition.negate());
    //translate(defaultControls.getTransform(), controlsPosition.negate());

    spaceStation.update([sun], deltaSeconds);

    //spaceStation.getTransform().position.y = Math.sin(elapsedSeconds / 5) * 10000;
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
