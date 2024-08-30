import { MissionNode } from "../../missionNode";
import { MissionContext } from "../../../missionContext";
import { UniverseObjectIdentifier } from "../../../../saveFile/universeCoordinates";
import { SeededStarSystemModel } from "../../../../starSystem/seededStarSystemModel";
import { SystemSeed } from "../../../../utils/systemSeed";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { CollisionMask } from "../../../../settings";

export class MissionSightSeeingLandNode implements MissionNode {
    private hasCompletedLock = false;

    private readonly objectId: UniverseObjectIdentifier;

    private readonly targetSystemSeed: SystemSeed;

    private readonly raycastResult = new PhysicsRaycastResult();

    constructor(objectId: UniverseObjectIdentifier) {
        this.objectId = objectId;
        this.targetSystemSeed = new SystemSeed(objectId.starSystem.starSectorX, objectId.starSystem.starSectorY, objectId.starSystem.starSectorZ, objectId.starSystem.index);
    }

    isCompleted(): boolean {
        return this.hasCompletedLock;
    }

    updateState(context: MissionContext) {
        if (this.hasCompletedLock) return;

        const currentSystem = context.currentSystem;
        const currentSystemModel = currentSystem.model;
        if (currentSystemModel instanceof SeededStarSystemModel) {
            // Skip if the current system is not the one we are looking for
            if (!currentSystemModel.seed.equals(this.targetSystemSeed)) {
                return;
            }
        }

        const targetObject = currentSystem.getOrbitalObjects().at(this.objectId.orbitalObjectIndex);
        if (targetObject === undefined) {
            throw new Error(`Could not find object with index ${this.objectId.orbitalObjectIndex}`);
        }

        const playerPosition = context.playerPosition;

        const downDirection = targetObject.getTransform().getAbsolutePosition().subtract(playerPosition).normalize();

        context.physicsEngine.raycastToRef(playerPosition, playerPosition.add(downDirection.scale(5)), this.raycastResult, { collideWith: CollisionMask.ENVIRONMENT });
        if (this.raycastResult.hasHit) {
            const distance = Vector3.Distance(playerPosition, this.raycastResult.hitPointWorld);
            const distanceThreshold = 10;

            if (distance < distanceThreshold) {
                this.hasCompletedLock = true;
            }
        }
    }
}
