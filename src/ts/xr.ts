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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { UberScene } from "./uberCore/uberScene";
import { translate } from "./uberCore/transforms/basicTransform";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Engine } from "@babylonjs/core/Engines/engine";

import HavokPhysics from "@babylonjs/havok";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { setMaxLinVel } from "./utils/havok";
import { TelluricPlanet } from "./planets/telluricPlanet/telluricPlanet";
import { ChunkForgeWorkers } from "./planets/telluricPlanet/terrain/chunks/chunkForgeWorkers";
import { Star } from "./stellarObjects/star/star";
import { Settings } from "./settings";
import { ScenePerformancePriority } from "@babylonjs/core/scene";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;

Settings.VERTEX_RESOLUTION = 32;

// Init Havok physics engine
const havokInstance = await HavokPhysics();
const havokPlugin = new HavokPlugin(true, havokInstance);
setMaxLinVel(havokPlugin, 10000, 10000);
console.log(`Havok initialized`);

const scene = new UberScene(engine, ScenePerformancePriority.Intermediate);
scene.useRightHandedSystem = true;
scene.enablePhysics(Vector3.Zero(), havokPlugin);

await Assets.Init(scene);

const sphereRadius = Settings.EARTH_RADIUS;

const camera = new FreeCamera("camera", new Vector3(0, 0, 0), scene);
camera.maxZ = 1e9;
camera.speed *= sphereRadius * 0.1;
camera.angularSensibility /= 10;
scene.setActiveCamera(camera);
camera.attachControl(canvas, true);

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
xrCamera.setTransformationFromNonVRCamera(camera);
xrCamera.maxZ = camera.maxZ;

const planet = new TelluricPlanet("xrPlanet", scene, 0.51, null);
translate(planet.getTransform(), new Vector3(0, 0, sphereRadius * 4));

const star = new Star("star", scene, 0.2); //PointLightWrapper(new PointLight("dir01", new Vector3(0, 1, 0), scene));
translate(star.getTransform(), new Vector3(0, 0, -sphereRadius * 5000));

/*const starfield = new StarfieldPostProcess(scene, [star], [planet], Quaternion.Identity());
camera.attachPostProcess(starfield);
xrCamera.attachPostProcess(starfield);

const ocean = new OceanPostProcess("ocean", planet, scene, [star]);
camera.attachPostProcess(ocean);
xrCamera.attachPostProcess(ocean);

if (planet.model.cloudsUniforms === null) throw new Error("Clouds uniforms are null");
FlatCloudsPostProcess.CreateAsync("clouds", planet, planet.model.cloudsUniforms, scene, [star]).then((clouds) => {
  camera.attachPostProcess(clouds);
  xrCamera.attachPostProcess(clouds);

  const atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet, 100e3, scene, [star]);
  camera.attachPostProcess(atmosphere);
  xrCamera.attachPostProcess(atmosphere);

  const lensflare = new LensFlarePostProcess(star, scene);
  camera.attachPostProcess(lensflare);
  xrCamera.attachPostProcess(lensflare);
});*/

const chunkForge = new ChunkForgeWorkers(Settings.VERTEX_RESOLUTION);

scene.onBeforeRenderObservable.add(() => {
    const deltaTime = engine.getDeltaTime() / 1000;

    if (scene.activeCamera === null) throw new Error("Active camera is null");

    if (camera.globalPosition.length() > 0) {
        translate(planet.getTransform(), camera.globalPosition.negate());
        translate(star.getTransform(), camera.globalPosition.negate());
        camera.position.set(0, 0, 0);
    }

    planet.updateLOD(scene.activeCamera.globalPosition, chunkForge);
    planet.updateMaterial(camera, [star], deltaTime);

    chunkForge.update();

    star.updateMaterial(deltaTime);

    //ocean.update(deltaTime);
});

scene.executeWhenReady(() => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize(true);
});
