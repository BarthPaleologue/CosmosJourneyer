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

import { StarSystemCoordinates, starSystemCoordinatesEquals } from "@/utils/coordinates/starSystemCoordinates";
import { UniverseObjectId, universeObjectIdEquals } from "@/utils/coordinates/universeObjectId";
import { getOrbitalObjectTypeToI18nString } from "@/utils/strings/orbitalObjectTypeToDisplay";
import { parseDistance } from "@/utils/strings/parseToStrings";

import { FlyByState, MissionFlyByNodeSerialized } from "../../../../../backend/missions/missionFlyByNodeSerialized";
import { MissionNodeType } from "../../../../../backend/missions/missionNodeType";
import i18n from "../../../../i18n";
import { Settings } from "../../../../settings";
import { getGoToSystemInstructions } from "../../../common";
import { MissionContext } from "../../../missionContext";
import { MissionNode } from "../../missionNode";
import type { MissionNodeBase } from "../../missionNodeBase";
import { OrbitalObjectType } from "../orbitalObjectType";

/**
 * Node used to describe a fly-by mission around a target object
 */
export class MissionFlyByNode implements MissionNodeBase<MissionNodeType.FLY_BY> {
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
            case OrbitalObjectType.STAR:
            case OrbitalObjectType.TELLURIC_PLANET:
            case OrbitalObjectType.TELLURIC_SATELLITE:
            case OrbitalObjectType.GAS_PLANET:
            case OrbitalObjectType.MANDELBULB:
            case OrbitalObjectType.JULIA_SET:
            case OrbitalObjectType.MANDELBOX:
            case OrbitalObjectType.SIERPINSKI_PYRAMID:
            case OrbitalObjectType.MENGER_SPONGE:
            case OrbitalObjectType.DARK_KNIGHT:
            case OrbitalObjectType.SPACE_STATION:
            case OrbitalObjectType.SPACE_ELEVATOR:
            case OrbitalObjectType.CUSTOM:
                thresholdMultiplier = 3;
                break;
            case OrbitalObjectType.NEUTRON_STAR:
                thresholdMultiplier = 70_000;
                break;
            case OrbitalObjectType.BLACK_HOLE:
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

    describe(originSystemCoordinates: StarSystemCoordinates, starSystemDatabase: StarSystemDatabase): string {
        const distance = Vector3.Distance(
            starSystemDatabase.getSystemGalacticPosition(originSystemCoordinates),
            starSystemDatabase.getSystemGalacticPosition(this.targetSystemCoordinates),
        );
        const objectModel = starSystemDatabase.getObjectModelByUniverseId(this.objectId);
        const systemModel = starSystemDatabase.getSystemModelFromCoordinates(this.targetSystemCoordinates);
        if (objectModel === null || systemModel === null) {
            return "ERROR: object or system model is null";
        }
        return i18n.t("missions:sightseeing:describeFlyBy", {
            objectType: getOrbitalObjectTypeToI18nString(objectModel),
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
            return i18n.t("missions:flyBy:missionCompleted");
        }

        const targetObject = starSystemDatabase.getObjectModelByUniverseId(this.objectId);
        if (targetObject === null) {
            return "ERROR: target object is null";
        }

        switch (this.state) {
            case FlyByState.NOT_IN_SYSTEM:
                return getGoToSystemInstructions(
                    context,
                    this.targetSystemCoordinates,
                    keyboardLayout,
                    starSystemDatabase,
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
            type: MissionNodeType.FLY_BY,
            objectId: this.objectId,
            state: this.state,
        };
    }
}
