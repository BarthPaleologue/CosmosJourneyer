import "../styles/index.scss";

import { Assets } from "./assets";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { OceanPostProcess } from "./postProcesses/oceanPostProcess";
import { TransformNode } from "@babylonjs/core/Meshes";
import { UberScene } from "./uberCore/uberScene";
import { Transformable, translate } from "./uberCore/transforms/basicTransform";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { EngineFactory } from "@babylonjs/core";
import { AtmosphericScatteringPostProcess } from "./postProcesses/atmosphericScatteringPostProcess";
import { TelluricPlanemo } from "./planemos/telluricPlanemo/telluricPlanemo";
import { ChunkForge } from "./planemos/telluricPlanemo/terrain/chunks/chunkForge";
import HavokPhysics from "@babylonjs/havok";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { setMaxLinVel } from "./utils/havok";
import { DefaultController } from "./defaultController/defaultController";
import { FlatCloudsPostProcess } from "./postProcesses/flatCloudsPostProcess";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { RingsPostProcess } from "./postProcesses/rings/ringsPostProcess";
import { RingsUniforms } from "./postProcesses/rings/ringsUniform";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const wasmPath = new URL("./utils/TWGSL/twgsl.wasm", import.meta.url);
const jsPath = new URL("./utils/TWGSL/twgsl.js", import.meta.url);

console.log(wasmPath, jsPath);

const engine = await EngineFactory.CreateAsync(canvas, {
    twgslOptions: {
        wasmPath: wasmPath.href,
        jsPath: jsPath.href
    }
});

engine.useReverseDepthBuffer = true;

const scene = new UberScene(engine);
scene.useRightHandedSystem = true;

// Init Havok physics engine
const havokInstance = await HavokPhysics();
const havokPlugin = new HavokPlugin(true, havokInstance);
setMaxLinVel(havokPlugin, 10000, 10000);
console.log(`Havok initialized`);

scene.enablePhysics(Vector3.Zero(), havokPlugin);

await Assets.Init(scene);

const chunkForge = new ChunkForge(64);

const defaultController = new DefaultController(scene);
defaultController.addInput(new Keyboard());
defaultController.addInput(new Mouse(canvas));
defaultController.getActiveCamera().maxZ = 1e3;
defaultController.speed *= 1000e3;
scene.setActiveController(defaultController);

const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);

const sphereRadius = 1000e3;
const sphere = new TelluricPlanemo("sphere", scene, 0.5);
sphere.model.ringsUniforms = new RingsUniforms(sphere.model.rng);
translate(sphere.getTransform(), new Vector3(0, 0, sphereRadius * 4));

defaultController.getActiveCamera().maxZ = sphereRadius * 10;

class LightWrapper implements Transformable {
    readonly light: DirectionalLight;
    readonly transform: TransformNode;

    constructor(light: DirectionalLight) {
        this.light = light;
        this.transform = new TransformNode("lightTransform");
        this.transform.position = light.direction.scale(-sphereRadius * 4);
    }

    getTransform(): TransformNode {
        return this.transform;
    }
}

const wrappedLight = new LightWrapper(light);

const starfield = new StarfieldPostProcess(scene, [wrappedLight], [sphere], Quaternion.Identity());
defaultController.getActiveCamera().attachPostProcess(starfield);

const ocean = new OceanPostProcess("ocean", sphere, scene, [wrappedLight]);
defaultController.getActiveCamera().attachPostProcess(ocean);

FlatCloudsPostProcess.CreateAsync("clouds", sphere, 10e3, scene, [wrappedLight]).then((clouds) => {
    defaultController.getActiveCamera().attachPostProcess(clouds);
    scene.onBeforeRenderObservable.add(() => clouds.update(scene.deltaTime * 0.001));

    const atmosphere = new AtmosphericScatteringPostProcess("atmosphere", sphere, 100e3, scene, [wrappedLight]);
    defaultController.getActiveCamera().attachPostProcess(atmosphere);

    RingsPostProcess.CreateAsync(sphere, scene, [wrappedLight]).then((rings) => {
        defaultController.getActiveCamera().attachPostProcess(rings);
    });
});

scene.onBeforePhysicsObservable.add(() => {
    const deltaTime = scene.deltaTime / 1000;
    sphere.updateInternalClock(deltaTime);
    sphere.computeCulling(defaultController.getActiveCamera());
    sphere.updateLOD(defaultController.getActiveCamera().getAbsolutePosition(), chunkForge);
    chunkForge.update();
    sphere.updateMaterial(defaultController, [wrappedLight], deltaTime);

    starfield.update(deltaTime);
    ocean.update(deltaTime);

    defaultController.update(scene.deltaTime);
    if (defaultController.getActiveCamera().getAbsolutePosition().length() > 100) {
        translate(sphere.getTransform(), defaultController.getActiveCamera().getAbsolutePosition().negate());
        translate(defaultController.getTransform(), defaultController.getActiveCamera().getAbsolutePosition().negate());
    }
});

scene.executeWhenReady(() => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});
