import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Transformable } from "../architecture/transformable";
import { BoundingSphere } from "../architecture/boundingSphere";
import { TypedObject } from "../architecture/typedObject";

export class SystemTarget implements Transformable, BoundingSphere, TypedObject {
    readonly name: string;
    private readonly transform: TransformNode;
    private readonly scene: Scene;

    constructor(name: string, scene: Scene) {
        this.name = name;
        this.transform = new TransformNode(name, scene);
        this.scene = scene;
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    dispose(): void {
        this.getTransform().dispose();
    }

    getBoundingRadius(): number {
        return 0;
    }

    getTypeName(): string {
        return "Star system";
    }

}