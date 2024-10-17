import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes";
import i18n from "../i18n";
import { StarSystemCoordinates } from "./coordinates/universeCoordinates";
import { getSystemModelFromCoordinates } from "../starSystem/modelFromCoordinates";
import { ObjectTargetCursorType, Targetable } from "../architecture/targetable";

export class SystemTarget implements Targetable {
    readonly name: string;
    private readonly transform: TransformNode;

    readonly systemCoordinates: StarSystemCoordinates;

    readonly targetInfo = {
        type: ObjectTargetCursorType.STAR_SYSTEM,
        minDistance: 0,
        maxDistance: 0
    };

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
