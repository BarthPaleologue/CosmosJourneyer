//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { StarSystemDatabase } from "@/backend/universe/starSystemDatabase";
import { getObjectModelById } from "@/backend/universe/starSystemModel";

import { StarSystemCoordinates, starSystemCoordinatesEquals } from "@/utils/coordinates/starSystemCoordinates";
import { UniverseObjectId, universeObjectIdEquals } from "@/utils/coordinates/universeObjectId";
import { clamp } from "@/utils/math";
import { parseDistance } from "@/utils/strings/parseToStrings";

import {
    AsteroidFieldMissionState,
    MissionAsteroidFieldNodeSerialized,
} from "../../../../../backend/missions/missionAsteroidFieldNodeSerialized";
import { MissionNodeType } from "../../../../../backend/missions/missionNodeType";
import i18n from "../../../../i18n";
import { Settings } from "../../../../settings";
import { getGoToSystemInstructions } from "../../../common";
import { MissionContext } from "../../../missionContext";
import { MissionNode } from "../../missionNode";
import type { MissionNodeBase } from "../../missionNodeBase";
import { OrbitalObjectType } from "../orbitalObjectType";

/**
 * Node used to describe a trek to an asteroid field
 */
export class MissionAsteroidFieldNode implements MissionNodeBase<MissionNodeType.ASTEROID_FIELD> {
    private state = AsteroidFieldMissionState.NOT_IN_SYSTEM;

    private readonly objectId: UniverseObjectId;

    private readonly targetSystemCoordinates: StarSystemCoordinates;

    private constructor(objectId: UniverseObjectId) {
        this.objectId = objectId;
        this.targetSystemCoordinates = objectId.systemCoordinates;
    }

    public static New(
        objectId: UniverseObjectId,
        starSystemDatabase: StarSystemDatabase,
    ): MissionAsteroidFieldNode | null {
        const systemModel = starSystemDatabase.getSystemModelFromCoordinates(objectId.systemCoordinates);
        if (systemModel === null) {
            return null;
        }

        const objectModel = getObjectModelById(objectId.idInSystem, systemModel);
        if (objectModel === null) {
            return null;
        }

        if (
            objectModel.type !== OrbitalObjectType.TELLURIC_PLANET &&
            objectModel.type !== OrbitalObjectType.GAS_PLANET
        ) {
            return null;
        }

        if (objectModel.rings === null) {
            return null;
        }

        return new MissionAsteroidFieldNode(objectId);
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

        // Skip if the current system is not the one we are looking for
        if (!starSystemCoordinatesEquals(currentSystemModel.coordinates, this.targetSystemCoordinates)) {
            this.state = AsteroidFieldMissionState.NOT_IN_SYSTEM;
            return;
        }

        const targetObject = currentSystem.getOrbitalObjectById(this.objectId.idInSystem);

        const celestialBody = currentSystem.getCelestialBodies().find((body) => body === targetObject);
        if (celestialBody === undefined) {
            return;
        }

        const asteroidField = celestialBody.asteroidField;
        if (asteroidField === null) {
            return;
        }

        const playerPositionWorld = context.playerPosition;

        // everything will be computed in local space from here
        const playerPosition = Vector3.TransformCoordinates(
            playerPositionWorld,
            celestialBody.getTransform().getWorldMatrix().clone().invert(),
        );

        const projectionOnPlane = new Vector3(playerPosition.x, 0, playerPosition.z);
        const distanceToCenterOfBodyInPlane = projectionOnPlane.length();

        const clampedLocalPosition = projectionOnPlane.scaleInPlace(
            clamp(distanceToCenterOfBodyInPlane, asteroidField.minRadius, asteroidField.maxRadius) /
                distanceToCenterOfBodyInPlane,
        );

        const distance = Vector3.Distance(playerPosition, clampedLocalPosition);

        const distanceThreshold = 1000;

        if (distance < distanceThreshold) {
            this.state = AsteroidFieldMissionState.CLOSE_ENOUGH;
        } else {
            this.state = AsteroidFieldMissionState.TOO_FAR_IN_SYSTEM;
        }
    }

    describe(originSystemCoordinates: StarSystemCoordinates, starSystemDatabase: StarSystemDatabase): string {
        const distance = Vector3.Distance(
            starSystemDatabase.getSystemGalacticPosition(originSystemCoordinates),
            starSystemDatabase.getSystemGalacticPosition(this.targetSystemCoordinates),
        );
        const objectModel = starSystemDatabase.getObjectModelByUniverseId(this.objectId);
        const systemModel = starSystemDatabase.getSystemModelFromCoordinates(this.targetSystemCoordinates);
        if (objectModel === null || systemModel === null) {
            return "ERROR: objectModel or systemModel is null";
        }
        return i18n.t("missions:sightseeing:describeAsteroidFieldTrek", {
            objectName: objectModel.name,
            systemName: systemModel.name,
            distance: distance > 0 ? parseDistance(distance * Settings.LIGHT_YEAR) : i18n.t("missions:common:here"),
        });
    }

    describeNextTask(
        context: MissionContext,
        keyboardLayout: Map<string, string>,
        starSystemDatabase: StarSystemDatabase,
    ): string {
        if (this.isCompleted()) {
            return i18n.t("missions:asteroidField:missionCompleted");
        }

        const targetObject = starSystemDatabase.getObjectModelByUniverseId(this.objectId);
        if (targetObject === null) {
            return "ERROR: targetObject is null";
        }

        switch (this.state) {
            case AsteroidFieldMissionState.NOT_IN_SYSTEM:
                return getGoToSystemInstructions(
                    context,
                    this.targetSystemCoordinates,
                    keyboardLayout,
                    starSystemDatabase,
                );
            case AsteroidFieldMissionState.TOO_FAR_IN_SYSTEM:
                return i18n.t("missions:common:getCloserToTarget", {
                    objectName: targetObject.name,
                });
            case AsteroidFieldMissionState.CLOSE_ENOUGH:
                return i18n.t("missions:asteroidField:missionCompleted");
        }
    }

    getTargetSystems(): StarSystemCoordinates[] {
        return [this.targetSystemCoordinates];
    }

    serialize(): MissionAsteroidFieldNodeSerialized {
        return {
            type: MissionNodeType.ASTEROID_FIELD,
            objectId: this.objectId,
            state: this.state,
        };
    }
}
