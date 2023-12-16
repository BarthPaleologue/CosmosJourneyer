import "../styles/index.scss";

import { Assets } from "./assets";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OceanPostProcess } from "./postProcesses/oceanPostProcess";
import { UberScene } from "./uberCore/uberScene";
import { translate } from "./uberCore/transforms/basicTransform";
import { PointLightWrapper, TransformNodeWrapper } from "./utils/wrappers";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Engine } from "@babylonjs/core/Engines/engine";

import "@babylonjs/core";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);

engine.useReverseDepthBuffer = true;

const scene = new UberScene(engine);
scene.useRightHandedSystem = true;

await Assets.Init(scene);

const sphereRadius = 1e3;

const camera = new FreeCamera("camera", new Vector3(0, 0, 0), scene);
camera.maxZ = 1e6;
camera.speed *= sphereRadius * 0.1;
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

const sphere = new TransformNodeWrapper(MeshBuilder.CreateSphere("sphere", { diameter: sphereRadius * 2 }, scene), sphereRadius);
translate(sphere.getTransform(), new Vector3(0, 0, sphereRadius * 4));

const star = new PointLightWrapper(new PointLight("dir01", new Vector3(0, 1, 0), scene));
translate(star.getTransform(), new Vector3(0, 0, -sphereRadius * 4e3));

const ocean = new OceanPostProcess("ocean", sphere, scene, [star]);
ocean.oceanUniforms.oceanRadius = sphereRadius * 1.1;
camera.attachPostProcess(ocean);

scene.onBeforeRenderObservable.add(() => {
    const deltaTime = scene.deltaTime / 1000;

    ocean.update(deltaTime);

    if (camera.globalPosition.length() > 100) {
        translate(sphere.getTransform(), camera.globalPosition.negate());
        translate(star.getTransform(), camera.globalPosition.negate());
        camera.position.set(0, 0, 0);
    }
});

scene.executeWhenReady(() => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});
