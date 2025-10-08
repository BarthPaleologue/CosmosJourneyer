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

import { MissionType } from "@/backend/missions/missionSerialized";
import { type UniverseBackend } from "@/backend/universe/universeBackend";
import { type UniverseObjectId } from "@/backend/universe/universeObjectId";

import { wrapVector3 } from "@/frontend/helpers/algebra";

import { Mission } from "./mission";
import { MissionAsteroidFieldNode } from "./nodes/actions/sightseeing/missionAsteroidFieldNode";
import { MissionFlyByNode } from "./nodes/actions/sightseeing/missionFlyByNode";
import { MissionTerminatorLandingNode } from "./nodes/actions/sightseeing/missionTerminatorLandingNode";
import { type MissionNode } from "./nodes/missionNode";

/**
 * Sightseeing mission types are a subset of mission types.
 */
export type SightSeeingType =
    | (typeof MissionType)["SIGHT_SEEING_FLY_BY"]
    | (typeof MissionType)["SIGHT_SEEING_TERMINATOR_LANDING"]
    | (typeof MissionType)["SIGHT_SEEING_ASTEROID_FIELD"];

/**
 * Defines a target for a sightseeing mission and the type of sightseeing mission.
 */
export type SightSeeingTarget = {
    type: SightSeeingType;
    objectId: UniverseObjectId;
};

function generateMissionTree(target: SightSeeingTarget, universeBackend: UniverseBackend): MissionNode | null {
    switch (target.type) {
        case MissionType.SIGHT_SEEING_FLY_BY:
            return new MissionFlyByNode(target.objectId);
        case MissionType.SIGHT_SEEING_TERMINATOR_LANDING:
            return new MissionTerminatorLandingNode(target.objectId);
        case MissionType.SIGHT_SEEING_ASTEROID_FIELD:
            return MissionAsteroidFieldNode.New(target.objectId, universeBackend);
    }
}

/**
 * Creates a new sightseeing mission from a mission giver to a target.
 * @param missionGiver The space station that gives the mission.
 * @param target The target of the sightseeing mission.
 * @returns The new sightseeing mission.
 */
export function newSightSeeingMission(
    missionGiver: UniverseObjectId,
    target: SightSeeingTarget,
    universeBackend: UniverseBackend,
): Mission | null {
    const missionTree = generateMissionTree(target, universeBackend);
    if (missionTree === null) {
        return null;
    }

    const targetSystemCoordinates = target.objectId.systemCoordinates;

    const missionGiverGalacticCoordinates = wrapVector3(
        universeBackend.getSystemGalacticPosition(missionGiver.systemCoordinates),
    );

    const targetGalacticCoordinates = wrapVector3(universeBackend.getSystemGalacticPosition(targetSystemCoordinates));
    const distanceLY = Vector3.Distance(missionGiverGalacticCoordinates, targetGalacticCoordinates);

    const targetModel = universeBackend.getObjectModelByUniverseId(target.objectId);

    // reward far away targets more
    let reward = Math.max(5_000, 1000 * Math.ceil(distanceLY));
    if (targetModel?.type === "neutronStar" || targetModel?.type === "blackHole") {
        // reward for stellar objects is higher to nudge the player towards them
        reward *= 1.5;
    }

    return new Mission(missionTree, reward, missionGiver, target.type);
}
