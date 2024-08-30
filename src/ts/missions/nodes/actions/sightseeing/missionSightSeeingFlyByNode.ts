import { MissionNode } from "../../missionNode";
import { MissionContext } from "../../../missionContext";
import { UniverseObjectIdentifier } from "../../../../saveFile/universeCoordinates";
import { SeededStarSystemModel } from "../../../../starSystem/seededStarSystemModel";
import { SystemSeed } from "../../../../utils/systemSeed";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class MissionSightSeeingFlyByNode implements MissionNode {
    private hasCompletedLock = false;

    private readonly objectId: UniverseObjectIdentifier;

    private readonly targetSystemSeed: SystemSeed;

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

        const distance = Vector3.Distance(playerPosition, targetObject.getTransform().getAbsolutePosition());

        const distanceThreshold = targetObject.getBoundingRadius() * 3;

        if (distance < distanceThreshold) {
            this.hasCompletedLock = true;
        }
    }
}
