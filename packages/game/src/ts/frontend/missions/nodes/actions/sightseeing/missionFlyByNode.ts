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

import { FlyByState, type MissionFlyByNodeSerialized } from "@/backend/missions/missionFlyByNodeSerialized";
import { starSystemCoordinatesEquals, type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type UniverseBackend } from "@/backend/universe/universeBackend";
import { universeObjectIdEquals, type UniverseObjectId } from "@/backend/universe/universeObjectId";

import { wrapVector3 } from "@/frontend/helpers/algebra";
import { getOrbitalObjectTypeToI18nString } from "@/frontend/helpers/orbitalObjectTypeToDisplay";

import { lightYearsToMeters } from "@/utils/physics/unitConversions";
import { parseDistance } from "@/utils/strings/parseToStrings";

import i18n from "@/i18n";

import { getGoToSystemInstructions } from "../../../common";
import { type MissionContext } from "../../../missionContext";
import { type MissionNode } from "../../missionNode";
import type { MissionNodeBase } from "../../missionNodeBase";

/**
 * Node used to describe a fly-by mission around a target object
 */
export class MissionFlyByNode implements MissionNodeBase<MissionFlyByNodeSerialized> {
    private state: FlyByState = FlyByState.NOT_IN_SYSTEM;

    private readonly objectId: UniverseObjectId;

    private readonly targetSystemCoordinates: StarSystemCoordinates;

    constructor(objectId: UniverseObjectId) {
        this.objectId = objectId;
        this.targetSystemCoordinates = objectId.systemCoordinates;
    }

    /**
     * Set the state of the fly-by mission. Useful when deserializing an ongoing mission.
     * @param state The state of the mission
     */
    public setState(state: FlyByState) {
        this.state = state;
    }

    isCompleted(): boolean {
        return this.state === FlyByState.CLOSE_ENOUGH;
    }

    equals(other: MissionNode): boolean {
        if (!(other instanceof MissionFlyByNode)) return false;
        return universeObjectIdEquals(this.objectId, other.objectId);
    }

    updateState(context: MissionContext) {
        if (this.isCompleted()) return;

        const currentSystem = context.currentSystem;
        const currentSystemModel = currentSystem.model;

        // Skip if the current system is not the one we are looking for
        if (!starSystemCoordinatesEquals(currentSystemModel.coordinates, this.targetSystemCoordinates)) {
            this.state = FlyByState.NOT_IN_SYSTEM;
            return;
        }

        const targetObject = currentSystem.getOrbitalObjectById(this.objectId.idInSystem);
        if (targetObject === undefined) {
            return;
        }

        const playerPosition = context.playerPosition;

        const distance = Vector3.Distance(playerPosition, targetObject.getTransform().getAbsolutePosition());

        let thresholdMultiplier = 1;
        switch (targetObject.type) {
            case "star":
            case "telluricPlanet":
            case "telluricSatellite":
            case "gasPlanet":
            case "mandelbulb":
            case "juliaSet":
            case "mandelbox":
            case "sierpinskiPyramid":
            case "mengerSponge":
            case "darkKnight":
            case "spaceStation":
            case "spaceElevator":
            case "custom":
                thresholdMultiplier = 3;
                break;
            case "neutronStar":
                thresholdMultiplier = 70_000;
                break;
            case "blackHole":
                thresholdMultiplier = 10;
                break;
        }

        const distanceThreshold = targetObject.getBoundingRadius() * thresholdMultiplier;

        if (distance < distanceThreshold) {
            this.state = FlyByState.CLOSE_ENOUGH;
        } else {
            this.state = FlyByState.TOO_FAR_IN_SYSTEM;
        }
    }

    describe(originSystemCoordinates: StarSystemCoordinates, universeBackend: UniverseBackend): string {
        const distanceLy = Vector3.Distance(
            wrapVector3(universeBackend.getSystemGalacticPosition(originSystemCoordinates)),
            wrapVector3(universeBackend.getSystemGalacticPosition(this.targetSystemCoordinates)),
        );
        const objectModel = universeBackend.getObjectModelByUniverseId(this.objectId);
        const systemModel = universeBackend.getSystemModelFromCoordinates(this.targetSystemCoordinates);
        if (objectModel === null || systemModel === null) {
            return "ERROR: object or system model is null";
        }
        return i18n.t("missions:sightseeing:describeFlyBy", {
            objectType: getOrbitalObjectTypeToI18nString(objectModel),
            systemName: systemModel.name,
            distance: distanceLy > 0 ? parseDistance(lightYearsToMeters(distanceLy)) : i18n.t("missions:common:here"),
        });
    }

    describeNextTask(
        context: MissionContext,
        keyboardLayout: Map<string, string>,
        universeBackend: UniverseBackend,
    ): string {
        if (this.isCompleted()) {
            return i18n.t("missions:flyBy:missionCompleted");
        }

        const targetObject = universeBackend.getObjectModelByUniverseId(this.objectId);
        if (targetObject === null) {
            return "ERROR: target object is null";
        }

        switch (this.state) {
            case FlyByState.NOT_IN_SYSTEM:
                return getGoToSystemInstructions(
                    context,
                    this.targetSystemCoordinates,
                    keyboardLayout,
                    universeBackend,
                );
            case FlyByState.TOO_FAR_IN_SYSTEM:
                return i18n.t("missions:common:getCloserToTarget", {
                    objectName: targetObject.name,
                });
            case FlyByState.CLOSE_ENOUGH:
                return i18n.t("missions:flyBy:missionCompleted");
        }
    }

    getTargetSystems(): StarSystemCoordinates[] {
        return [this.targetSystemCoordinates];
    }

    serialize(): MissionFlyByNodeSerialized {
        return {
            type: "fly_by",
            objectId: this.objectId,
            state: this.state,
        };
    }
}
