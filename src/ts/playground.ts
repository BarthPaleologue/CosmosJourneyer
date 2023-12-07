import "../styles/index.scss";

import { Assets } from "./assets";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { OceanPostProcess } from "./postProcesses/oceanPostProcess";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { BaseObject } from "./bodies/common";
import { PostProcessType } from "./postProcesses/postProcessTypes";
import { TransformNode } from "@babylonjs/core/Meshes";
import { UberScene } from "./uberCore/uberScene";
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
defaultController.getActiveCamera().maxZ = 1e3;
defaultController.speed *= 10;
scene.setActiveController(defaultController);

const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);

const sphereRadius = 200;
const sphere = MeshBuilder.CreateSphere("sphere", { diameter: sphereRadius * 2 }, scene);
sphere.rotationQuaternion = Quaternion.Identity();
sphere.position.z = sphereRadius * 4;

defaultController.getActiveCamera().maxZ = sphereRadius * 10;

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
    this.transform.position = light.direction.scale(-sphereRadius * 4);
  }

  getTransform(): TransformNode {
    return this.transform;
  }
}

const wrappedSphere = new MeshWrapper(sphere, sphereRadius);
const wrappedLight = new LightWrapper(light);

const ocean = new OceanPostProcess("ocean", wrappedSphere, scene, [wrappedLight]);
ocean.oceanUniforms.oceanRadius *= 1.2;
defaultController.getActiveCamera().attachPostProcess(ocean);

scene.onBeforeRenderObservable.add(() => {
  defaultController.update(scene.deltaTime / 1000);
});

scene.executeWhenReady(() => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});
