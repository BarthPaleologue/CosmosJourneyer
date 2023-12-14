import "../styles/index.scss";

import { Assets } from "./assets";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { OceanPostProcess } from "./postProcesses/oceanPostProcess";
import { UberScene } from "./uberCore/uberScene";
import { translate } from "./uberCore/transforms/basicTransform";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { EngineFactory } from "@babylonjs/core";
import { DefaultController } from "./defaultController/defaultController"
import { PointLightWrapper, TransformNodeWrapper } from "./utils/wrappers";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PointLight } from "@babylonjs/core/Lights/pointLight";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const wasmPath = new URL("./utils/TWGSL/twgsl.wasm", import.meta.url);
const jsPath = new URL("./utils/TWGSL/twgsl.js", import.meta.url);

const engine = await EngineFactory.CreateAsync(canvas, {
    twgslOptions: {
        wasmPath: wasmPath.href,
        jsPath: jsPath.href
    }
});

engine.useReverseDepthBuffer = true;

const scene = new UberScene(engine);
scene.useRightHandedSystem = true;

await Assets.Init(scene);

const sphereRadius = 1e3;

const defaultController = new DefaultController(scene);
defaultController.addInput(new Keyboard());
defaultController.addInput(new Mouse(canvas));
defaultController.getActiveCamera().maxZ = 1e6;
defaultController.speed *= sphereRadius;
scene.setActiveController(defaultController);

const sphere = new TransformNodeWrapper(MeshBuilder.CreateSphere("sphere", {diameter: sphereRadius*2}, scene), sphereRadius);
translate(sphere.getTransform(), new Vector3(0, 0, sphereRadius * 4));

const star = new PointLightWrapper(new PointLight("dir01", new Vector3(0, 1, 0), scene));
translate(star.getTransform(), new Vector3(0, 0, -sphereRadius * 4));


const ocean = new OceanPostProcess("ocean", sphere, scene, [star]);
ocean.oceanUniforms.oceanRadius = sphereRadius * 1.1;
defaultController.getActiveCamera().attachPostProcess(ocean);

scene.onBeforeRenderObservable.add(() => {
    const deltaTime = scene.deltaTime / 1000;

    ocean.update(deltaTime);

    defaultController.update(scene.deltaTime);
    if (defaultController.getActiveCamera().getAbsolutePosition().length() > 100) {
        translate(sphere.getTransform(), defaultController.getActiveCamera().getAbsolutePosition().negate());
        translate(star.getTransform(), defaultController.getActiveCamera().getAbsolutePosition().negate());
        translate(defaultController.getTransform(), defaultController.getActiveCamera().getAbsolutePosition().negate());
    }
});

scene.executeWhenReady(() => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});
