import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Transformable } from "../architecture/transformable";
import { BoundingSphere } from "../architecture/boundingSphere";
import { TypedObject } from "../architecture/typedObject";
import { SystemSeed } from "./systemSeed";
import { StarSystemModel } from "../starSystem/starSystemModel";
import i18n from "../i18n";

export class SystemTarget implements Transformable, BoundingSphere, TypedObject {
    readonly name: string;
    private readonly transform: TransformNode;
    private readonly scene: Scene;

    readonly seed: SystemSeed;

    constructor(seed: SystemSeed, scene: Scene) {
        const systemModel = new StarSystemModel(seed);
        this.name = systemModel.getName();
        this.transform = new TransformNode(this.name, scene);
        this.scene = scene;

        this.seed = seed;
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
        return i18n.t("objectTypes:starSystem");
    }
}
