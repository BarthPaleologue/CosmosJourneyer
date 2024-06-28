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
import { Axis, DirectionalLight, HavokPlugin, HemisphericLight, MeshBuilder, PhysicsAggregate, PhysicsShapeType, PhysicsViewer, Scene } from "@babylonjs/core";
import { Assets } from "./assets/assets";
import { DefaultControls } from "./defaultControls/defaultControls";
import { AsteroidField } from "./asteroidFields/asteroidField";
import HavokPhysics from "@babylonjs/havok";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const havokInstance = await HavokPhysics();

const scene = new Scene(engine);
scene.useRightHandedSystem = true;

const havokPlugin = new HavokPlugin(true, havokInstance);
scene.enablePhysics(new Vector3(0, 0, 0), havokPlugin);

const defaultControls = new DefaultControls(scene);


const camera = defaultControls.getActiveCameras()[0];
camera.attachControl();

scene.enableDepthRenderer(camera, false, true);

await Assets.Init(scene);

const directionalLight = new DirectionalLight("sun", new Vector3(1, -1, 0), scene);
directionalLight.intensity = 0.7;

const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);
hemi.intensity = 0.4;

const scaler = 10;

defaultControls.getTransform().position.z = -200 * scaler;
defaultControls.getTransform().position.y = 20 * scaler;
defaultControls.speed *= scaler;

const sphere = MeshBuilder.CreateSphere("box", { diameter: 20 * scaler }, scene);

const sphereAggregate = new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, {mass:0}, scene);

const beltRadius = 100 * scaler;
const beltSpread = 20 * scaler;

const belt = new AsteroidField(sphere, beltRadius, beltSpread, scene);

const torus = MeshBuilder.CreateTorus("torus", { diameter: 2 * beltRadius, thickness: 2 * beltSpread, tessellation: 32 }, scene);
torus.visibility = 0.1;
torus.parent = sphere;


const physicsViewer = new PhysicsViewer(scene);

scene.onBeforeRenderObservable.add(() => {
    defaultControls.update(engine.getDeltaTime() / 1000);

    belt.update(defaultControls.getTransform().getAbsolutePosition(), engine.getDeltaTime() / 1000);

    sphere.rotate(Axis.Y, 0.0002);
    /*scene.meshes.forEach((mesh) => {
        if (mesh.physicsBody) physicsViewer.showBody(mesh.physicsBody);
    });*/
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
