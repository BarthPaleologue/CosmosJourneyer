import { Transformable } from "../uberCore/transforms/basicTransform";
import { BoundingSphere } from "../bodies/common";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";

export class TransformNodeWrapper implements Transformable, BoundingSphere {
  readonly transform: TransformNode;
  readonly radius: number;
  constructor(mesh: TransformNode, radius: number) {
    this.transform = mesh;
    this.transform.rotationQuaternion = Quaternion.Identity();
    this.radius = radius;
  }

  getBoundingRadius(): number {
    return this.radius;
  }

  getTransform(): TransformNode {
    return this.transform;
  }
}

export class DirectionalLightWrapper implements Transformable {
  readonly light: DirectionalLight;
  readonly transform: TransformNode;

  constructor(light: DirectionalLight) {
    this.light = light;
    this.transform = new TransformNode("lightTransform");
  }

  getTransform(): TransformNode {
    return this.transform;
  }
}