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
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";

import { MissionNodeType } from "@/backend/missions/missionNodeType";
import {
    LandMissionState,
    type MissionTerminatorLandingNodeSerialized,
} from "@/backend/missions/missionTerminatorLandingNodeSerialized";
import { starSystemCoordinatesEquals, type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type UniverseBackend } from "@/backend/universe/universeBackend";
import { universeObjectIdEquals, type UniverseObjectId } from "@/backend/universe/universeObjectId";

import { wrapVector3 } from "@/frontend/helpers/algebra";

import { lightYearsToMeters } from "@/utils/physics/unitConversions";
import { parseDistance } from "@/utils/strings/parseToStrings";

import i18n from "@/i18n";
import { CollisionMask } from "@/settings";

import { getGoToSystemInstructions } from "../../../common";
import { type MissionContext } from "../../../missionContext";
import { type MissionNode } from "../../missionNode";
import type { MissionNodeBase } from "../../missionNodeBase";

/**
 * Node used to describe a landing mission on a target object near the terminator line
 */
export class MissionTerminatorLandingNode implements MissionNodeBase<MissionNodeType.TERMINATOR_LANDING> {
    private state: LandMissionState = LandMissionState.NOT_IN_SYSTEM;

    private readonly objectId: UniverseObjectId;

    private readonly targetSystemCoordinates: StarSystemCoordinates;

    private readonly raycastResult = new PhysicsRaycastResult();

    constructor(objectId: UniverseObjectId) {
        this.objectId = objectId;
        this.targetSystemCoordinates = objectId.systemCoordinates;
    }

    /**
     * Set the state of the landing mission. Useful when deserializing an ongoing mission.
     * @param state The state of the mission
     */
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

        // Skip if the current system is not the one we are looking for
        if (!starSystemCoordinatesEquals(currentSystemModel.coordinates, this.targetSystemCoordinates)) {
            this.state = LandMissionState.NOT_IN_SYSTEM;
            return;
        }

        const targetObject = currentSystem.getOrbitalObjectById(this.objectId.idInSystem);
        if (targetObject === undefined) {
            return;
        }

        const playerPosition = context.playerPosition;
        const targetObjectPosition = targetObject.getTransform().getAbsolutePosition();

        if (Vector3.Distance(playerPosition, targetObjectPosition) > targetObject.getBoundingRadius() + 100e3) {
            this.state = LandMissionState.TOO_FAR_IN_SYSTEM;
            return;
        }

        const downDirection = targetObjectPosition.subtract(playerPosition).normalize();

        context.physicsEngine.raycastToRef(
            playerPosition,
            playerPosition.add(downDirection.scale(5)),
            this.raycastResult,
            {
                collideWith: CollisionMask.ENVIRONMENT,
            },
        );
        if (this.raycastResult.hasHit) {
            if (this.raycastResult.body?.transformNode.parent !== targetObject.getTransform()) {
                this.state = LandMissionState.TOO_FAR_IN_SYSTEM;
                return;
            }

            const stellarObjects = currentSystem.getStellarObjects();
            const stellarMassSum = stellarObjects.reduce((sum, stellarObject) => sum + stellarObject.model.mass, 0);
            const stellarBarycenter = stellarObjects
                .reduce(
                    (sum, stellarObject) =>
                        sum.add(stellarObject.getTransform().getAbsolutePosition().scale(stellarObject.model.mass)),
                    Vector3.Zero(),
                )
                .scaleInPlace(1 / stellarMassSum);

            const objectToPlayer = downDirection.negate();
            const targetToStar = stellarBarycenter.subtract(targetObjectPosition).normalize();

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
        return i18n.t("missions:sightseeing:describeTerminatorLanding", {
            objectName: objectModel.name,
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
            return i18n.t("missions:terminatorLanding:missionCompleted");
        }

        const targetObject = universeBackend.getObjectModelByUniverseId(this.objectId);
        if (targetObject === null) {
            return "ERROR: target object is null";
        }

        switch (this.state) {
            case LandMissionState.NOT_IN_SYSTEM:
                return getGoToSystemInstructions(
                    context,
                    this.targetSystemCoordinates,
                    keyboardLayout,
                    universeBackend,
                );
            case LandMissionState.TOO_FAR_IN_SYSTEM:
                return i18n.t("missions:terminatorLanding:getCloserToTerminator", {
                    objectName: targetObject.name,
                });
            case LandMissionState.LANDED:
                return i18n.t("missions:terminatorLanding:missionCompleted");
        }
    }

    getTargetSystems(): StarSystemCoordinates[] {
        return [this.targetSystemCoordinates];
    }

    serialize(): MissionTerminatorLandingNodeSerialized {
        return {
            type: MissionNodeType.TERMINATOR_LANDING,
            objectId: this.objectId,
            state: this.state,
        };
    }
}
