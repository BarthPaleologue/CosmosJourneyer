import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes";
import i18n from "../i18n";
import { StarSystemCoordinates } from "./coordinates/universeCoordinates";
import { ObjectTargetCursorType, Targetable } from "../architecture/targetable";
import { Settings } from "../settings";
import { StarSystemModel } from "../starSystem/starSystemModel";

export class SystemTarget implements Targetable {
    readonly name: string;
    private readonly transform: TransformNode;

    readonly systemCoordinates: StarSystemCoordinates;

    readonly targetInfo = {
        type: ObjectTargetCursorType.STAR_SYSTEM,
        minDistance: Settings.LIGHT_YEAR * 2,
        maxDistance: Settings.LIGHT_YEAR * 0.2
    };

    constructor(systemModel: StarSystemModel, scene: Scene) {
        this.name = systemModel.name;
        this.transform = new TransformNode(this.name, scene);
        this.systemCoordinates = systemModel.coordinates;
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
