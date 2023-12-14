import "../styles/index.scss";

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { UberScene } from "./uberCore/uberScene";
import { translate } from "./uberCore/transforms/basicTransform";
import { EngineFactory } from "@babylonjs/core";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { DirectionalLightWrapper, TransformNodeWrapper } from "./utils/wrappers";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { OceanPostProcess } from "./postProcesses/oceanPostProcess";
import { DefaultController } from "./defaultController/defaultController";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";

// target alignment with https://www.babylonjs-playground.com/#1PHYB0#366

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = await EngineFactory.CreateAsync(canvas, {});
engine.useReverseDepthBuffer = true;

console.log(engine.getCaps());
console.log(engine.getCaps().textureFloatRender);

const scene = new UberScene(engine);
scene.useRightHandedSystem = true;

const sphereRadius = 1e3;

const controller = new DefaultController(scene);
controller.addInput(new Keyboard());
controller.addInput(new Mouse(canvas));
controller.speed *= sphereRadius;
const camera = controller.getActiveCamera();
camera.maxZ = sphereRadius * 1000;

scene.setActiveController(controller);

const light = new DirectionalLight("dir01", new Vector3(1, 1, 1).normalize(), scene);

const planet = new TransformNodeWrapper(MeshBuilder.CreateSphere("sphere", { diameter: sphereRadius * 2 }, scene), sphereRadius);
translate(planet.getTransform(), new Vector3(0, 0, sphereRadius * 4));

const wrappedLight = new DirectionalLightWrapper(light);
translate(wrappedLight.getTransform(),light.direction.scale(-sphereRadius * 4));

const ocean = new OceanPostProcess("ocean", planet, scene, [wrappedLight]);
ocean.oceanUniforms.oceanRadius = sphereRadius * 1.2;
camera.attachPostProcess(ocean);

scene.onBeforeRenderObservable.add(() => {
    controller.update(scene.deltaTime / 1000);

    if (controller.getTransform().getAbsolutePosition().length() > 100) {
        translate(planet.getTransform(), controller.getTransform().getAbsolutePosition().negate());
        translate(controller.getTransform(), controller.getTransform().getAbsolutePosition().negate());
    }
});

scene.executeWhenReady(() => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});
