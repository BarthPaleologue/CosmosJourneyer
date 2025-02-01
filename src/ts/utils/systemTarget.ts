import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes";
import i18n from "../i18n";
import { StarSystemCoordinates } from "./coordinates/universeCoordinates";
import { ObjectTargetCursorType, Targetable } from "../architecture/targetable";
import { Settings } from "../settings";
import { StarSystemModel } from "../starSystem/starSystemModel";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";

export class SystemTarget implements Targetable {
    readonly name: string;
    private readonly transform: TransformNode;

    readonly systemCoordinates: StarSystemCoordinates;

    private readonly referencePlanePosition: Vector3;

    readonly targetInfo = {
        type: ObjectTargetCursorType.STAR_SYSTEM,
        minDistance: Settings.LIGHT_YEAR * 2,
        maxDistance: Settings.LIGHT_YEAR * 0.2
    };

    constructor(systemModel: StarSystemModel, referencePlanePosition: Vector3, scene: Scene) {
        this.name = systemModel.name;
        this.transform = new TransformNode(this.name, scene);
        this.systemCoordinates = systemModel.coordinates;

        this.referencePlanePosition = referencePlanePosition;
        this.transform.position.copyFrom(referencePlanePosition);
    }

    updatePosition(referencePlaneRotation: Matrix) {
        Vector3.TransformCoordinatesToRef(this.referencePlanePosition, referencePlaneRotation, this.transform.position);
        this.transform.computeWorldMatrix(true);
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
