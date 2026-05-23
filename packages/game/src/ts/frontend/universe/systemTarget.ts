import { Vector3, type Matrix } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { type Scene } from "@babylonjs/core/scene";
import { lightYearsToMeters } from "@cosmos-journeyer/physics";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import { type StarSystemCoordinates, type StarSystemModel } from "@cosmos-journeyer/universe-model";

import { ObjectTargetCursorType, type Targetable, type TargetInfo } from "@/frontend/universe/architecture/targetable";

import i18n from "@/i18n";

export class SystemTarget implements Targetable {
    readonly name: string;
    private readonly transform: TransformNode;

    readonly systemCoordinates: StarSystemCoordinates;

    private readonly referencePlanePosition: Vector3;

    readonly targetInfo: TargetInfo;

    constructor(systemModel: DeepReadonly<StarSystemModel>, referencePlanePosition: Vector3, scene: Scene) {
        this.name = systemModel.name;
        this.transform = new TransformNode(this.name, scene);
        this.systemCoordinates = systemModel.coordinates;

        this.targetInfo = {
            type: ObjectTargetCursorType.STAR_SYSTEM,
            name: this.name,
            minDistance: lightYearsToMeters(2),
            maxDistance: lightYearsToMeters(0.2),
        };

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
