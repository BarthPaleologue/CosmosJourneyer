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

import { type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { uniformRandBool } from "extended-random";

import { MissionType } from "@/backend/missions/missionSerialized";
import { type OrbitalFacilityModel } from "@/backend/universe/orbitalObjects/index";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";
import { type StarSystemModel } from "@/backend/universe/starSystemModel";
import { getUniverseObjectId, type UniverseObjectId } from "@/backend/universe/universeObjectId";

import { getNeighborStarSystemCoordinates } from "@/frontend/helpers/getNeighborStarSystems";
import { type Player } from "@/frontend/player/player";

import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { type DeepReadonly } from "@/utils/types";

import { type Mission } from "./mission";
import { newSightSeeingMission } from "./sightSeeingMission";

/**
 * Generates sightseeing missions available at the given space station for the player. Missions are generated based on the current timestamp (hourly basis).
 * @param spaceStationModel The space station model where the missions are generated
 * @param starSystemModel
 * @param player The player for which the missions are generated
 * @param timestampMillis The current timestamp in milliseconds
 */
export function generateSightseeingMissions(
    spaceStationModel: DeepReadonly<OrbitalFacilityModel>,
    starSystemModel: DeepReadonly<StarSystemModel>,
    starSystemDatabase: StarSystemDatabase,
    player: Player,
    timestampMillis: number,
): ReadonlyArray<Mission> {
    const currentHour = Math.floor(timestampMillis / 1000 / 60 / 60) % (24 * 30);

    const missions: Array<Mission> = [];

    const rng = getRngFromSeed(spaceStationModel.seed + currentHour);

    const spaceStationUniverseId = getUniverseObjectId(spaceStationModel, starSystemModel);

    const neighborSystems = getNeighborStarSystemCoordinates(starSystemModel.coordinates, 75, starSystemDatabase);
    neighborSystems.forEach(({ coordinates: systemCoordinates, position: systemPosition, distance }) => {
        const neighborSystemModel = starSystemDatabase.getSystemModelFromCoordinates(systemCoordinates);
        if (neighborSystemModel === null) {
            return;
        }

        missions.push(
            ...generateSightseeingMissionsInSystem(
                neighborSystemModel,
                systemPosition,
                spaceStationUniverseId,
                distance,
                rng,
                starSystemDatabase,
            ),
        );
    });

    missions.push(
        ...generateAsteroidFieldMissionsInSystem(starSystemModel, spaceStationUniverseId, starSystemDatabase),
    );

    missions.push(
        ...generateTerminatorLandingMissionsInSystem(starSystemModel, spaceStationUniverseId, starSystemDatabase),
    );

    // filter missions to avoid duplicates with already accepted missions of the player
    return missions.filter((mission) =>
        player.currentMissions
            .concat(player.completedMissions)
            .every((currentMission) => !mission.equals(currentMission)),
    );
}

function generateSightseeingMissionsInSystem(
    systemModel: DeepReadonly<StarSystemModel>,
    systemPosition: Vector3,
    spaceStationUniverseId: UniverseObjectId,
    distance: number,
    rng: (seed: number) => number,
    starSystemDatabase: StarSystemDatabase,
): ReadonlyArray<Mission> {
    const missions: Array<Mission> = [];

    missions.push(
        ...generateAnomalyFlyByMissionsInSystem(
            systemModel,
            systemPosition,
            spaceStationUniverseId,
            distance,
            rng,
            starSystemDatabase,
        ),
    );

    missions.push(...generateNeutronStarFlyByMissionsInSystem(systemModel, spaceStationUniverseId, starSystemDatabase));

    missions.push(...generateBlackHoleFlyByMissionsInSystem(systemModel, spaceStationUniverseId, starSystemDatabase));

    return missions;
}

function generateAnomalyFlyByMissionsInSystem(
    systemModel: DeepReadonly<StarSystemModel>,
    systemPosition: Vector3,
    spaceStationUniverseId: UniverseObjectId,
    distance: number,
    rng: (seed: number) => number,
    starSystemDatabase: StarSystemDatabase,
): ReadonlyArray<Mission> {
    const missions: Array<Mission> = [];
    for (const [anomalyIndex, anomaly] of systemModel.anomalies.entries()) {
        if (!uniformRandBool(1.0 / (1.0 + 1.5 * distance), rng, 38 + anomalyIndex + systemPosition.length())) {
            continue;
        }

        if (anomaly.type === "darkKnight") {
            continue;
        }

        const mission = newSightSeeingMission(
            spaceStationUniverseId,
            {
                type: MissionType.SIGHT_SEEING_FLY_BY,
                objectId: {
                    systemCoordinates: systemModel.coordinates,
                    idInSystem: anomaly.id,
                },
            },
            starSystemDatabase,
        );

        if (mission === null) {
            continue;
        }

        missions.push(mission);
    }

    return missions;
}

function generateNeutronStarFlyByMissionsInSystem(
    systemModel: DeepReadonly<StarSystemModel>,
    spaceStationUniverseId: UniverseObjectId,
    starSystemDatabase: StarSystemDatabase,
): ReadonlyArray<Mission> {
    const missions: Array<Mission> = [];

    const neutronStars = systemModel.stellarObjects.filter((model) => model.type === "neutronStar");
    for (const neutronStar of neutronStars) {
        const mission = newSightSeeingMission(
            spaceStationUniverseId,
            {
                type: MissionType.SIGHT_SEEING_FLY_BY,
                objectId: {
                    systemCoordinates: systemModel.coordinates,
                    idInSystem: neutronStar.id,
                },
            },
            starSystemDatabase,
        );

        if (mission === null) {
            continue;
        }
        missions.push(mission);
    }

    return missions;
}

function generateBlackHoleFlyByMissionsInSystem(
    systemModel: DeepReadonly<StarSystemModel>,
    spaceStationUniverseId: UniverseObjectId,
    starSystemDatabase: StarSystemDatabase,
): ReadonlyArray<Mission> {
    const missions: Array<Mission> = [];

    const blackHoles = systemModel.stellarObjects.filter((model) => model.type === "blackHole");
    for (const blackHole of blackHoles) {
        const mission = newSightSeeingMission(
            spaceStationUniverseId,
            {
                type: MissionType.SIGHT_SEEING_FLY_BY,
                objectId: {
                    systemCoordinates: systemModel.coordinates,
                    idInSystem: blackHole.id,
                },
            },
            starSystemDatabase,
        );

        if (mission === null) {
            continue;
        }
        missions.push(mission);
    }

    return missions;
}

function generateAsteroidFieldMissionsInSystem(
    systemModel: DeepReadonly<StarSystemModel>,
    spaceStationUniverseId: UniverseObjectId,
    starSystemDatabase: StarSystemDatabase,
): ReadonlyArray<Mission> {
    const missions: Array<Mission> = [];

    for (const planet of systemModel.planets) {
        if (planet.rings === null) {
            continue;
        }

        const mission = newSightSeeingMission(
            spaceStationUniverseId,
            {
                type: MissionType.SIGHT_SEEING_ASTEROID_FIELD,
                objectId: {
                    systemCoordinates: systemModel.coordinates,
                    idInSystem: planet.id,
                },
            },
            starSystemDatabase,
        );

        if (mission === null) {
            continue;
        }
        missions.push(mission);
    }

    return missions;
}

function generateTerminatorLandingMissionsInSystem(
    systemModel: DeepReadonly<StarSystemModel>,
    spaceStationUniverseId: UniverseObjectId,
    starSystemDatabase: StarSystemDatabase,
): ReadonlyArray<Mission> {
    const missions: Array<Mission> = [];

    for (const planet of systemModel.planets) {
        if (planet.type !== "telluricPlanet") {
            continue;
        }

        if (planet.ocean !== null) {
            continue;
        }

        const mission = newSightSeeingMission(
            spaceStationUniverseId,
            {
                type: MissionType.SIGHT_SEEING_TERMINATOR_LANDING,
                objectId: {
                    systemCoordinates: systemModel.coordinates,
                    idInSystem: planet.id,
                },
            },
            starSystemDatabase,
        );

        if (mission === null) {
            continue;
        }
        missions.push(mission);
    }

    return missions;
}
