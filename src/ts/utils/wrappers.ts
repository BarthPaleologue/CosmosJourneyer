import { TransformNode } from "@babylonjs/core/Meshes";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Transformable } from "../architecture/transformable";
import { BoundingSphere } from "../architecture/boundingSphere";

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

    dispose(): void {
        this.transform.dispose();
    }
}

export class DirectionalLightWrapper implements Transformable {
    readonly light: DirectionalLight;
    readonly transform: TransformNode;

    constructor(light: DirectionalLight) {
        this.light = light;
        this.transform = new TransformNode("lightTransform");
        this.light.parent = this.transform;
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    dispose() {
        this.light.dispose();
        this.transform.dispose();
    }
}

export class PointLightWrapper implements Transformable {
    readonly light: PointLight;
    readonly transform: TransformNode;

    constructor(light: PointLight) {
        this.light = light;
        this.transform = new TransformNode("lightTransform");
        this.light.parent = this.transform;
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    dispose() {
        this.light.dispose();
        this.transform.dispose();
    }
}
