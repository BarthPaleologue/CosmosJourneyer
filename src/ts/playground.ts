import "../styles/index.scss";

import { Engine } from "@babylonjs/core/Engines/engine";
import { Assets } from "./assets";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { OceanPostProcess } from "./postProcesses/oceanPostProcess";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { BaseObject } from "./bodies/common";
import { PostProcessType } from "./postProcesses/postProcessTypes";
import { TransformNode } from "@babylonjs/core/Meshes";
import { UberScene } from "./uberCore/uberScene";
import { AbstractController } from "./uberCore/abstractController";
import { UberCamera } from "./uberCore/uberCamera";
import { Input } from "./inputs/input";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { DefaultController } from "./defaultController/defaultController";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { Transformable } from "./uberCore/transforms/basicTransform";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { EngineFactory } from "@babylonjs/core";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = await EngineFactory.CreateAsync(canvas, {});
engine.useReverseDepthBuffer = true;

const scene = new UberScene(engine);
scene.useRightHandedSystem = true;

await Assets.Init(scene);

const defaultController = new DefaultController(scene);
defaultController.addInput(new Keyboard());
defaultController.addInput(new Mouse(canvas));
defaultController.getTransform().setAbsolutePosition(new Vector3(0, 0, -10));
defaultController.getActiveCamera().maxZ = 1e3;
defaultController.speed *= 10;
scene.setActiveController(defaultController);

const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);

const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 4 }, scene);
sphere.rotationQuaternion = Quaternion.Identity();

class MeshWrapper implements BaseObject {
  readonly mesh: Mesh;
  readonly radius: number;
  readonly name: string;
  postProcesses: PostProcessType[] = [];

  constructor(mesh: Mesh, radius: number) {
    this.name = mesh.name;
    this.mesh = mesh;
    this.radius = radius;
  }
  getBoundingRadius(): number {
    return this.radius;
  }

  getTransform(): TransformNode {
    return this.mesh;
  }
}

class LightWrapper implements Transformable {
  readonly light: DirectionalLight;
  readonly transform: TransformNode;

  constructor(light: DirectionalLight) {
    this.light = light;
    this.transform = new TransformNode("lightTransform");
    this.transform.position = light.direction.scale(-10);
  }

  getTransform(): TransformNode {
    return this.transform;
  }
}

const wrappedSphere = new MeshWrapper(sphere, 2);
const wrappedLight = new LightWrapper(light);

const ocean = new OceanPostProcess("ocean", wrappedSphere, scene, [wrappedLight]);
ocean.oceanUniforms.oceanRadius += 0.2;
ocean.oceanUniforms.alphaModifier = 1;
ocean.oceanUniforms.depthModifier = 1;
defaultController.getActiveCamera().attachPostProcess(ocean);

scene.onBeforeRenderObservable.add(() => {
  defaultController.update(scene.deltaTime / 1000);
});

scene.executeWhenReady(() => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});
