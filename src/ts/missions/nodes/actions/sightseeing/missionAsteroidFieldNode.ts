import { MissionNode, MissionNodeSerialized, MissionNodeType } from "../../missionNode";
import { MissionContext } from "../../../missionContext";
import { UniverseObjectId, universeObjectIdEquals } from "../../../../saveFile/universeCoordinates";
import { SeededStarSystemModel } from "../../../../starSystem/seededStarSystemModel";
import { SystemSeed } from "../../../../utils/systemSeed";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { clamp } from "../../../../utils/math";
import { getObjectBySystemId, getObjectModelByUniverseId } from "../../../../utils/orbitalObjectId";
import { getStarGalacticCoordinates } from "../../../../utils/getStarGalacticCoordinates";
import i18n from "../../../../i18n";
import { parseDistance } from "../../../../utils/parseToStrings";
import { Settings } from "../../../../settings";
import { pressInteractionToStrings } from "../../../../utils/inputControlsString";
import { GeneralInputs } from "../../../../inputs/generalInputs";
import { getGlobalKeyboardLayoutMap } from "../../../../utils/keyboardAPI";

const enum AsteroidFieldMissionState {
    NOT_IN_SYSTEM,
    TOO_FAR_IN_SYSTEM,
    CLOSE_ENOUGH
}

export type MissionAsteroidFieldNodeSerialized = MissionNodeSerialized & {
    objectId: UniverseObjectId;
    state: AsteroidFieldMissionState;
};

/**
 * Node used to describe a trek to an asteroid field
 */
export class MissionAsteroidFieldNode implements MissionNode {
    private state = AsteroidFieldMissionState.NOT_IN_SYSTEM;

    private readonly objectId: UniverseObjectId;

    private readonly targetSystemSeed: SystemSeed;

    constructor(objectId: UniverseObjectId) {
        this.objectId = objectId;
        this.targetSystemSeed = new SystemSeed(objectId.starSystem.starSectorX, objectId.starSystem.starSectorY, objectId.starSystem.starSectorZ, objectId.starSystem.index);
    }

    /**
     * Set the state of the asteroid field mission. Useful when deserializing an ongoing mission.
     * @param state The state of the mission
     */
    public setState(state: AsteroidFieldMissionState) {
        this.state = state;
    }

    isCompleted(): boolean {
        return this.state === AsteroidFieldMissionState.CLOSE_ENOUGH;
    }

    equals(other: MissionNode): boolean {
        if (!(other instanceof MissionAsteroidFieldNode)) return false;
        return universeObjectIdEquals(this.objectId, other.objectId);
    }

    updateState(context: MissionContext) {
        if (this.isCompleted()) return;

        const currentSystem = context.currentSystem;
        const currentSystemModel = currentSystem.model;
        if (currentSystemModel instanceof SeededStarSystemModel) {
            // Skip if the current system is not the one we are looking for
            if (!currentSystemModel.seed.equals(this.targetSystemSeed)) {
                this.state = AsteroidFieldMissionState.NOT_IN_SYSTEM;
                return;
            }
        }

        const targetObject = getObjectBySystemId(this.objectId, currentSystem);
        if (targetObject === null) {
            throw new Error(`Could not find object with ID ${JSON.stringify(this.objectId)}`);
        }

        const celestialBody = currentSystem.celestialBodies.find((body) => body === targetObject);
        if (celestialBody === undefined) {
            throw new Error(`Object with ID ${JSON.stringify(this.objectId)} is not a celestial body`);
        }

        const asteroidField = celestialBody.getAsteroidField();
        if (asteroidField === null) {
            throw new Error(`Object with ID ${JSON.stringify(this.objectId)} does not have an asteroid field`);
        }

        const playerPositionWorld = context.playerPosition;

        // everything will be computed in local space from here
        const playerPosition = Vector3.TransformCoordinates(playerPositionWorld, celestialBody.getTransform().getWorldMatrix().clone().invert());

        const projectionOnPlane = new Vector3(playerPosition.x, 0, playerPosition.z);
        const distanceToCenterOfBodyInPlane = projectionOnPlane.length();

        const clampedLocalPosition = projectionOnPlane.scaleInPlace(
            clamp(distanceToCenterOfBodyInPlane, asteroidField.minRadius, asteroidField.maxRadius) / distanceToCenterOfBodyInPlane
        );

        const distance = Vector3.Distance(playerPosition, clampedLocalPosition);

        const distanceThreshold = 1000;

        if (distance < distanceThreshold) {
            this.state = AsteroidFieldMissionState.CLOSE_ENOUGH;
        } else {
            this.state = AsteroidFieldMissionState.TOO_FAR_IN_SYSTEM;
        }
    }

    describe(originSeed: SystemSeed): string {
        const distance = Vector3.Distance(getStarGalacticCoordinates(originSeed), getStarGalacticCoordinates(this.targetSystemSeed));
        const objectModel = getObjectModelByUniverseId(this.objectId);
        const systemModel = new SeededStarSystemModel(this.targetSystemSeed);
        return i18n.t("missions:sightseeing:describeAsteroidFieldTrek", {
            objectName: objectModel.name,
            systemName: systemModel.name,
            distance: distance > 0 ? parseDistance(distance * Settings.LIGHT_YEAR) : i18n.t("missions:common:here")
        });
    }

    async describeNextTask(context: MissionContext): Promise<string> {
        if (this.isCompleted()) {
            return i18n.t("missions:asteroidField:missionCompleted");
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
            case AsteroidFieldMissionState.NOT_IN_SYSTEM:
                return i18n.t("missions:common:travelToTargetSystem", {
                    systemName: targetSystemModel.name,
                    distance: parseDistance(distance * Settings.LIGHT_YEAR),
                    starMapKey: pressInteractionToStrings(GeneralInputs.map.toggleStarMap, keyboardLayout).join(` ${i18n.t("common:or")} `)
                });
            case AsteroidFieldMissionState.TOO_FAR_IN_SYSTEM:
                return i18n.t("missions:common:getCloserToTarget", {
                    objectName: targetObject.name
                });
            case AsteroidFieldMissionState.CLOSE_ENOUGH:
                return i18n.t("missions:asteroidField:missionCompleted");
        }
    }

    getTargetSystems(): SystemSeed[] {
        return [this.targetSystemSeed];
    }

    serialize(): MissionAsteroidFieldNodeSerialized {
        return {
            type: MissionNodeType.ASTEROID_FIELD,
            children: [],
            objectId: this.objectId,
            state: this.state
        };
    }
}