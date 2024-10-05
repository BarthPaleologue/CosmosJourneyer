import { MissionNode } from "../../missionNode";
import { MissionContext } from "../../../missionContext";
import { UniverseObjectId } from "../../../../saveFile/universeCoordinates";
import { SeededStarSystemModel } from "../../../../starSystem/seededStarSystemModel";
import { SystemSeed } from "../../../../utils/systemSeed";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { CollisionMask, Settings } from "../../../../settings";
import { getObjectBySystemId, getObjectModelByUniverseId } from "../../../../utils/orbitalObjectId";
import { getStarGalacticCoordinates } from "../../../../utils/getStarGalacticCoordinates";
import i18n from "../../../../i18n";
import { parseDistance } from "../../../../utils/parseToStrings";

const enum LandMissionState {
    NOT_IN_SYSTEM,
    TOO_FAR_IN_SYSTEM,
    LANDED
}

export class MissionSightSeeingLandNode implements MissionNode {
    private state: LandMissionState = LandMissionState.NOT_IN_SYSTEM;

    private readonly objectId: UniverseObjectId;

    private readonly targetSystemSeed: SystemSeed;

    private readonly raycastResult = new PhysicsRaycastResult();

    constructor(objectId: UniverseObjectId) {
        this.objectId = objectId;
        this.targetSystemSeed = new SystemSeed(objectId.starSystem.starSectorX, objectId.starSystem.starSectorY, objectId.starSystem.starSectorZ, objectId.starSystem.index);
    }

    isCompleted(): boolean {
        return this.state === LandMissionState.LANDED;
    }

    updateState(context: MissionContext) {
        if (this.isCompleted()) return;

        const currentSystem = context.currentSystem;
        const currentSystemModel = currentSystem.model;
        if (currentSystemModel instanceof SeededStarSystemModel) {
            // Skip if the current system is not the one we are looking for
            if (!currentSystemModel.seed.equals(this.targetSystemSeed)) {
                this.state = LandMissionState.NOT_IN_SYSTEM;
                return;
            }
        }

        const targetObject = getObjectBySystemId(this.objectId, currentSystem);
        if (targetObject === null) {
            throw new Error(`Could not find object with ID ${JSON.stringify(this.objectId)}`);
        }

        const playerPosition = context.playerPosition;

        const downDirection = targetObject.getTransform().getAbsolutePosition().subtract(playerPosition).normalize();

        context.physicsEngine.raycastToRef(playerPosition, playerPosition.add(downDirection.scale(5)), this.raycastResult, { collideWith: CollisionMask.ENVIRONMENT });
        if (this.raycastResult.hasHit) {
            const distance = Vector3.Distance(playerPosition, this.raycastResult.hitPointWorld);
            const distanceThreshold = 10;

            if (distance < distanceThreshold) {
                this.state = LandMissionState.LANDED;
                return;
            }
        }

        this.state = LandMissionState.TOO_FAR_IN_SYSTEM;
    }

    describeNextTask(context: MissionContext): string {
        const targetSystemModel = new SeededStarSystemModel(this.targetSystemSeed);
        const currentSystemModel = context.currentSystem.model;
        if (!(currentSystemModel instanceof SeededStarSystemModel)) {
            throw new Error("Cannot handle non-seeded star system models yet");
        }

        const targetSystemPosition = getStarGalacticCoordinates(this.targetSystemSeed);
        const currentSystemPosition = getStarGalacticCoordinates(currentSystemModel.seed);
        const distance = Vector3.Distance(targetSystemPosition, currentSystemPosition);

        const targetObject = getObjectModelByUniverseId(this.objectId);

        switch (this.state) {
            case LandMissionState.NOT_IN_SYSTEM:
                return i18n.t("missions:common:travelToTargetSystem", {
                    systemName: targetSystemModel.name,
                    distance: parseDistance(distance * Settings.LIGHT_YEAR)
                });
            case LandMissionState.TOO_FAR_IN_SYSTEM:
                return i18n.t("missions:common:getCloserToTarget", {
                    objectName: targetObject.name
                });
            case LandMissionState.LANDED:
                return i18n.t("missions:terminatorLanding:missionCompleted");
        }
    }
}
