import { MissionNode, MissionNodeSerialized, MissionNodeType } from "../../missionNode";
import { MissionContext } from "../../../missionContext";
import { UniverseObjectId } from "../../../../saveFile/universeCoordinates";
import { SeededStarSystemModel } from "../../../../starSystem/seededStarSystemModel";
import { SystemSeed } from "../../../../utils/systemSeed";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getObjectBySystemId, getObjectModelByUniverseId } from "../../../../utils/orbitalObjectId";
import { getStarGalacticCoordinates } from "../../../../utils/getStarGalacticCoordinates";
import { parseDistance } from "../../../../utils/parseToStrings";
import { Settings } from "../../../../settings";
import i18n from "../../../../i18n";
import { getGlobalKeyboardLayoutMap } from "../../../../utils/keyboardAPI";
import { pressInteractionToStrings } from "../../../../utils/inputControlsString";
import { GeneralInputs } from "../../../../inputs/generalInputs";

const enum FlyByState {
    NOT_IN_SYSTEM,
    TOO_FAR_IN_SYSTEM,
    CLOSE_ENOUGH
}

export type MissionFlyByNodeSerialized = MissionNodeSerialized & {
    objectId: UniverseObjectId;
};

export class MissionFlyByNode implements MissionNode {
    private state: FlyByState = FlyByState.NOT_IN_SYSTEM;

    private readonly objectId: UniverseObjectId;

    private readonly targetSystemSeed: SystemSeed;

    constructor(objectId: UniverseObjectId) {
        this.objectId = objectId;
        this.targetSystemSeed = new SystemSeed(objectId.starSystem.starSectorX, objectId.starSystem.starSectorY, objectId.starSystem.starSectorZ, objectId.starSystem.index);
    }

    isCompleted(): boolean {
        return this.state === FlyByState.CLOSE_ENOUGH;
    }

    updateState(context: MissionContext) {
        if (this.isCompleted()) return;

        const currentSystem = context.currentSystem;
        const currentSystemModel = currentSystem.model;
        if (currentSystemModel instanceof SeededStarSystemModel) {
            // Skip if the current system is not the one we are looking for
            if (!currentSystemModel.seed.equals(this.targetSystemSeed)) {
                this.state = FlyByState.NOT_IN_SYSTEM;
                return;
            }
        }

        const targetObject = getObjectBySystemId(this.objectId, currentSystem);
        if (targetObject === null) {
            throw new Error(`Could not find object with ID ${JSON.stringify(this.objectId)}`);
        }

        const playerPosition = context.playerPosition;

        const distance = Vector3.Distance(playerPosition, targetObject.getTransform().getAbsolutePosition());

        const distanceThreshold = targetObject.getBoundingRadius() * 3;

        if (distance < distanceThreshold) {
            this.state = FlyByState.CLOSE_ENOUGH;
        } else {
            this.state = FlyByState.TOO_FAR_IN_SYSTEM;
        }
    }

    async describeNextTask(context: MissionContext): Promise<string> {
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
            case FlyByState.NOT_IN_SYSTEM:
                return i18n.t("missions:common:travelToTargetSystem", {
                    systemName: targetSystemModel.name,
                    distance: parseDistance(distance * Settings.LIGHT_YEAR),
                    starMapKey: pressInteractionToStrings(GeneralInputs.map.toggleStarMap, keyboardLayout).join(` ${i18n.t("common:or")} `)
                });
            case FlyByState.TOO_FAR_IN_SYSTEM:
                return i18n.t("missions:common:getCloserToTarget", {
                    objectName: targetObject.name
                });
            case FlyByState.CLOSE_ENOUGH:
                return i18n.t("missions:flyBy:missionCompleted");
        }
    }

    serialize(): MissionFlyByNodeSerialized {
        return {
            type: MissionNodeType.FLY_BY,
            children: [],
            objectId: this.objectId
        };
    }
}
