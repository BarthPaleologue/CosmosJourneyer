import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Scene } from "@babylonjs/core/scene";

import { StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { StarSystemModel } from "@/backend/universe/starSystemModel";

import { ObjectTargetCursorType, Targetable } from "@/frontend/universe/architecture/targetable";

import i18n from "@/i18n";

import { lightYearsToMeters } from "./physics/unitConversions";
import { DeepReadonly } from "./types";

export class SystemTarget implements Targetable {
    readonly name: string;
    private readonly transform: TransformNode;

    readonly systemCoordinates: StarSystemCoordinates;

    private readonly referencePlanePosition: Vector3;

    readonly targetInfo = {
        type: ObjectTargetCursorType.STAR_SYSTEM,
        minDistance: lightYearsToMeters(2),
        maxDistance: lightYearsToMeters(0.2),
    };

    constructor(systemModel: DeepReadonly<StarSystemModel>, referencePlanePosition: Vector3, scene: Scene) {
        this.name = systemModel.name;
        this.transform = new TransformNode(this.name, scene);
        this.systemCoordinates = systemModel.coordinates;

        this.referencePlanePosition = referencePlanePosition;
        this.transform.position.copyFrom(referencePlanePosition);
    }

    updatePosition(referencePlaneRotation: Matrix, referencePosition: Vector3) {
        Vector3.TransformCoordinatesToRef(this.referencePlanePosition, referencePlaneRotation, this.transform.position);
        this.transform.position.addInPlace(referencePosition);
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
