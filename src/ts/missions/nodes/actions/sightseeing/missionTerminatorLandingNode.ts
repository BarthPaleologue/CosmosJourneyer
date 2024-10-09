import { MissionNode, MissionNodeSerialized, MissionNodeType } from "../../missionNode";
import { MissionContext } from "../../../missionContext";
import { UniverseObjectId, universeObjectIdEquals } from "../../../../saveFile/universeCoordinates";
import { SeededStarSystemModel } from "../../../../starSystem/seededStarSystemModel";
import { SystemSeed } from "../../../../utils/systemSeed";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { CollisionMask, Settings } from "../../../../settings";
import { getObjectBySystemId, getObjectModelByUniverseId } from "../../../../utils/orbitalObjectId";
import { getStarGalacticCoordinates } from "../../../../utils/getStarGalacticCoordinates";
import i18n from "../../../../i18n";
import { parseDistance } from "../../../../utils/parseToStrings";
import { getGlobalKeyboardLayoutMap } from "../../../../utils/keyboardAPI";
import { pressInteractionToStrings } from "../../../../utils/inputControlsString";
import { GeneralInputs } from "../../../../inputs/generalInputs";

const enum LandMissionState {
    NOT_IN_SYSTEM,
    TOO_FAR_IN_SYSTEM,
    LANDED
}

export type MissionTerminatorLandingNodeSerialized = MissionNodeSerialized & {
    objectId: UniverseObjectId;
    state: LandMissionState;
};

export class MissionTerminatorLandingNode implements MissionNode {
    private state: LandMissionState = LandMissionState.NOT_IN_SYSTEM;

    private readonly objectId: UniverseObjectId;

    private readonly targetSystemSeed: SystemSeed;

    private readonly raycastResult = new PhysicsRaycastResult();

    constructor(objectId: UniverseObjectId) {
        this.objectId = objectId;
        this.targetSystemSeed = new SystemSeed(objectId.starSystem.starSectorX, objectId.starSystem.starSectorY, objectId.starSystem.starSectorZ, objectId.starSystem.index);
    }

    setState(state: LandMissionState) {
        this.state = state;
    }

    isCompleted(): boolean {
        return this.state === LandMissionState.LANDED;
    }

    equals(other: MissionNode): boolean {
        if (!(other instanceof MissionTerminatorLandingNode)) return false;
        return universeObjectIdEquals(this.objectId, other.objectId);
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
        const targetObjectPosition = targetObject.getTransform().getAbsolutePosition();

        if (Vector3.Distance(playerPosition, targetObjectPosition) > targetObject.getBoundingRadius() + 100e3) {
            this.state = LandMissionState.TOO_FAR_IN_SYSTEM;
            return;
        }

        const downDirection = targetObjectPosition.subtract(playerPosition).normalize();

        context.physicsEngine.raycastToRef(playerPosition, playerPosition.add(downDirection.scale(5)), this.raycastResult, { collideWith: CollisionMask.ENVIRONMENT });
        if (this.raycastResult.hasHit) {
            if (this.raycastResult.body?.transformNode.parent !== targetObject.getTransform()) {
                this.state = LandMissionState.TOO_FAR_IN_SYSTEM;
                return;
            }

            const starTransform = currentSystem.stellarObjects[0].getTransform();

            const objectToPlayer = downDirection.negate();
            const targetToStar = starTransform.getAbsolutePosition().subtract(targetObjectPosition).normalize();

            if (Math.abs(Vector3.Dot(objectToPlayer, targetToStar)) > Math.cos(Math.PI / 6)) {
                this.state = LandMissionState.TOO_FAR_IN_SYSTEM;
                return;
            }

            const distance = Vector3.Distance(playerPosition, this.raycastResult.hitPointWorld);
            const distanceThreshold = 10;

            if (distance < distanceThreshold) {
                this.state = LandMissionState.LANDED;
                return;
            }
        }

        this.state = LandMissionState.TOO_FAR_IN_SYSTEM;
    }

    describe(originSeed: SystemSeed): string {
        const distance = Vector3.Distance(getStarGalacticCoordinates(originSeed), getStarGalacticCoordinates(this.targetSystemSeed));
        const objectModel = getObjectModelByUniverseId(this.objectId);
        const systemModel = new SeededStarSystemModel(this.targetSystemSeed);
        return i18n.t("missions:sightseeing:describeTerminatorLanding", {
            objectName: objectModel.name,
            systemName: systemModel.name,
            distance: distance > 0 ? parseDistance(distance * Settings.LIGHT_YEAR) : i18n.t("missions:common:here")
        });
    }

    async describeNextTask(context: MissionContext): Promise<string> {
        if (this.isCompleted()) {
            return i18n.t("missions:terminatorLanding:missionCompleted");
        }

        const targetSystemModel = new SeededStarSystemModel(this.targetSystemSeed);
        const currentSystemModel = context.currentSystem.model;
        if (!(currentSystemModel instanceof SeededStarSystemModel)) {
            throw new Error("Cannot handle non-seeded star system models yet");
        }

        const targetSystemPosition = getStarGalacticCoordinates(this.targetSystemSeed);
        const currentSystemPosition = getStarGalacticCoordinates(currentSystemModel.seed);
        const distance = Vector3.Distance(targetSystemPosition, currentSystemPosition);

        const targetObject = getObjectModelByUniverseId(this.objectId);

        const keyboardLayout = await getGlobalKeyboardLayoutMap();

        switch (this.state) {
            case LandMissionState.NOT_IN_SYSTEM:
                return i18n.t("missions:common:travelToTargetSystem", {
                    systemName: targetSystemModel.name,
                    distance: parseDistance(distance * Settings.LIGHT_YEAR),
                    starMapKey: pressInteractionToStrings(GeneralInputs.map.toggleStarMap, keyboardLayout).join(` ${i18n.t("common:or")} `)
                });
            case LandMissionState.TOO_FAR_IN_SYSTEM:
                return i18n.t("missions:terminatorLanding:getCloserToTerminator", {
                    objectName: targetObject.name
                });
            case LandMissionState.LANDED:
                return i18n.t("missions:terminatorLanding:missionCompleted");
        }
    }

    getTargetSystems(): SystemSeed[] {
        return [this.targetSystemSeed];
    }

    serialize(): MissionTerminatorLandingNodeSerialized {
        return {
            type: MissionNodeType.TERMINATOR_LANDING,
            children: [],
            objectId: this.objectId,
            state: this.state
        };
    }
}
