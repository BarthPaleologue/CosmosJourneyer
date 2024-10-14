import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Transformable } from "../architecture/transformable";
import { HasBoundingSphere } from "../architecture/hasBoundingSphere";
import { TypedObject } from "../architecture/typedObject";
import i18n from "../i18n";
import { StarSystemCoordinates } from "./coordinates/universeCoordinates";
import { getSystemModelFromCoordinates } from "../starSystem/modelFromCoordinates";

export class SystemTarget implements Transformable, HasBoundingSphere, TypedObject {
    readonly name: string;
    private readonly transform: TransformNode;

    readonly systemCoordinates: StarSystemCoordinates;

    constructor(systemCoordinates: StarSystemCoordinates, scene: Scene) {
        const systemModel = getSystemModelFromCoordinates(systemCoordinates);
        this.name = systemModel.name;
        this.transform = new TransformNode(this.name, scene);
        this.systemCoordinates = systemCoordinates;
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
