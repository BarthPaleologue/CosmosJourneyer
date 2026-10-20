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

import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { uniformRandBool, getRngFromSeed } from "@cosmos-journeyer/random";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { OrbitalFacilityModel, UniverseObjectId } from "@cosmos-journeyer/universe-model";

import { MissionType } from "@/backend/missions/missionSerialized";
import type { StarSystemContentModel, UniverseBackend } from "@/backend/universe/universeBackend";

import { getNeighborStarSystemCoordinates } from "@/frontend/helpers/getNeighborStarSystems";
import type { Player } from "@/frontend/player/player";

import type { Mission } from "./mission";
import { newSightSeeingMission } from "./sightSeeingMission";

/**
 * Generates station missions deterministically for the current hour.
 * @param spaceStationModel - Station offering the missions.
 * @param systemContentModel - System content and orbital-object data.
 * @param universeBackend - Universe lookup for target objects.
 * @param player - Player whose accepted and completed missions are excluded.
 * @param timestampMillis - Timestamp in milliseconds used to select the hourly set.
 * @returns Available station and nearby-system missions not already accepted or completed.
 */
export function generateSightseeingMissions(
    spaceStationModel: DeepReadonly<OrbitalFacilityModel>,
    systemContentModel: DeepReadonly<StarSystemContentModel>,
    universeBackend: UniverseBackend,
    player: Player,
    timestampMillis: number,
): ReadonlyArray<Mission> {
    const currentHour = Math.floor(timestampMillis / 1000 / 60 / 60) % (24 * 30);

    const missions: Array<Mission> = [];

    const rng = getRngFromSeed(spaceStationModel.seed + currentHour);

    const spaceStationUniverseId: UniverseObjectId = {
        systemCoordinates: systemContentModel.system.coordinates,
        idInSystem: spaceStationModel.id,
    };

    const neighborSystems = getNeighborStarSystemCoordinates(
        systemContentModel.system.coordinates,
        75,
        universeBackend,
    );
    neighborSystems.forEach(({ coordinates: systemCoordinates, position: systemPosition, distance }) => {
        const neighborSystemModel = universeBackend.getSystemContentModelAt(systemCoordinates);
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
                universeBackend,
            ),
        );
    });

    missions.push(
        ...generateAsteroidFieldMissionsInSystem(systemContentModel, spaceStationUniverseId, universeBackend),
    );

    missions.push(
        ...generateTerminatorLandingMissionsInSystem(systemContentModel, spaceStationUniverseId, universeBackend),
    );

    // filter missions to avoid duplicates with already accepted missions of the player
    return missions.filter((mission) =>
        player.currentMissions
            .concat(player.completedMissions)
            .every((currentMission) => !mission.equals(currentMission)),
    );
}

/**
 * Collects eligible anomaly, neutron-star, and black-hole fly-by missions in a neighboring system.
 * @param systemModel - Target system content and orbital-object data.
 * @param systemPosition - Galactic position used in deterministic anomaly sampling.
 * @param spaceStationUniverseId - Universe identifier of the station offering the mission.
 * @param distance - Distance from the mission giver in light-years.
 * @param rng - Seeded source used to choose anomaly missions.
 * @param universeBackend - Universe lookup for target objects.
 * @returns Generated fly-by missions for valid targets.
 */
function generateSightseeingMissionsInSystem(
    systemModel: DeepReadonly<StarSystemContentModel>,
    systemPosition: Vector3,
    spaceStationUniverseId: UniverseObjectId,
    distance: number,
    rng: (seed: number) => number,
    universeBackend: UniverseBackend,
): ReadonlyArray<Mission> {
    const missions: Array<Mission> = [];

    missions.push(
        ...generateAnomalyFlyByMissionsInSystem(
            systemModel,
            systemPosition,
            spaceStationUniverseId,
            distance,
            rng,
            universeBackend,
        ),
    );

    missions.push(...generateNeutronStarFlyByMissionsInSystem(systemModel, spaceStationUniverseId, universeBackend));

    missions.push(...generateBlackHoleFlyByMissionsInSystem(systemModel, spaceStationUniverseId, universeBackend));

    return missions;
}

/**
 * Samples anomaly fly-by missions with a probability that decreases with system distance.
 * @param systemContentModel - System content and orbital-object data.
 * @param systemPosition - Galactic position used in deterministic anomaly sampling.
 * @param spaceStationUniverseId - Universe identifier of the station offering the mission.
 * @param distance - Distance from the mission giver in light-years.
 * @param rng - Random source used to sample placements or missions.
 * @param universeBackend - Universe lookup for target objects.
 * @returns Sampled anomaly fly-by missions.
 */
function generateAnomalyFlyByMissionsInSystem(
    systemContentModel: DeepReadonly<StarSystemContentModel>,
    systemPosition: Vector3,
    spaceStationUniverseId: UniverseObjectId,
    distance: number,
    rng: (seed: number) => number,
    universeBackend: UniverseBackend,
): ReadonlyArray<Mission> {
    const missions: Array<Mission> = [];
    for (const [anomalyIndex, anomaly] of systemContentModel.system.anomalies.entries()) {
        if (!uniformRandBool(1.0 / (1.0 + 1.5 * distance), rng, 38 + anomalyIndex + systemPosition.length())) {
            continue;
        }

        const mission = newSightSeeingMission(
            spaceStationUniverseId,
            {
                type: MissionType.SIGHT_SEEING_FLY_BY,
                objectId: {
                    systemCoordinates: systemContentModel.system.coordinates,
                    idInSystem: anomaly.id,
                },
            },
            universeBackend,
        );

        if (mission === null) {
            continue;
        }

        missions.push(mission);
    }

    return missions;
}

/**
 * @param systemContentModel - System content and orbital-object data.
 * @param spaceStationUniverseId - Universe identifier of the station offering the mission.
 * @param universeBackend - Universe lookup for target objects.
 * @returns Fly-by missions for neutron-star targets.
 */
function generateNeutronStarFlyByMissionsInSystem(
    systemContentModel: DeepReadonly<StarSystemContentModel>,
    spaceStationUniverseId: UniverseObjectId,
    universeBackend: UniverseBackend,
): ReadonlyArray<Mission> {
    const missions: Array<Mission> = [];

    const neutronStars = systemContentModel.system.stellarObjects.filter((model) => model.type === "neutronStar");
    for (const neutronStar of neutronStars) {
        const mission = newSightSeeingMission(
            spaceStationUniverseId,
            {
                type: MissionType.SIGHT_SEEING_FLY_BY,
                objectId: {
                    systemCoordinates: systemContentModel.system.coordinates,
                    idInSystem: neutronStar.id,
                },
            },
            universeBackend,
        );

        if (mission === null) {
            continue;
        }
        missions.push(mission);
    }

    return missions;
}

/**
 * @param systemContentModel - System content and orbital-object data.
 * @param spaceStationUniverseId - Universe identifier of the station offering the mission.
 * @param universeBackend - Universe lookup for target objects.
 * @returns Fly-by missions for black-hole targets.
 */
function generateBlackHoleFlyByMissionsInSystem(
    systemContentModel: DeepReadonly<StarSystemContentModel>,
    spaceStationUniverseId: UniverseObjectId,
    universeBackend: UniverseBackend,
): ReadonlyArray<Mission> {
    const missions: Array<Mission> = [];

    const blackHoles = systemContentModel.system.stellarObjects.filter((model) => model.type === "blackHole");
    for (const blackHole of blackHoles) {
        const mission = newSightSeeingMission(
            spaceStationUniverseId,
            {
                type: MissionType.SIGHT_SEEING_FLY_BY,
                objectId: {
                    systemCoordinates: systemContentModel.system.coordinates,
                    idInSystem: blackHole.id,
                },
            },
            universeBackend,
        );

        if (mission === null) {
            continue;
        }
        missions.push(mission);
    }

    return missions;
}

/**
 * Creates asteroid-field missions for planets with rings.
 * @param systemContentModel - System content and orbital-object data.
 * @param spaceStationUniverseId - Universe identifier of the station offering the mission.
 * @param universeBackend - Universe lookup for target objects.
 * @returns Missions for valid asteroid-field targets.
 */
function generateAsteroidFieldMissionsInSystem(
    systemContentModel: DeepReadonly<StarSystemContentModel>,
    spaceStationUniverseId: UniverseObjectId,
    universeBackend: UniverseBackend,
): ReadonlyArray<Mission> {
    const missions: Array<Mission> = [];

    for (const planet of systemContentModel.system.planets) {
        if (planet.rings === null) {
            continue;
        }

        const mission = newSightSeeingMission(
            spaceStationUniverseId,
            {
                type: MissionType.SIGHT_SEEING_ASTEROID_FIELD,
                objectId: {
                    systemCoordinates: systemContentModel.system.coordinates,
                    idInSystem: planet.id,
                },
            },
            universeBackend,
        );

        if (mission === null) {
            continue;
        }
        missions.push(mission);
    }

    return missions;
}

/**
 * Creates terminator-landing missions for telluric planets without oceans.
 * @param systemContentModel - System content and orbital-object data.
 * @param spaceStationUniverseId - Universe identifier of the station offering the mission.
 * @param universeBackend - Universe lookup for target objects.
 * @returns Missions for eligible landing targets.
 */
function generateTerminatorLandingMissionsInSystem(
    systemContentModel: DeepReadonly<StarSystemContentModel>,
    spaceStationUniverseId: UniverseObjectId,
    universeBackend: UniverseBackend,
): ReadonlyArray<Mission> {
    const missions: Array<Mission> = [];

    for (const planet of systemContentModel.system.planets) {
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
                    systemCoordinates: systemContentModel.system.coordinates,
                    idInSystem: planet.id,
                },
            },
            universeBackend,
        );

        if (mission === null) {
            continue;
        }
        missions.push(mission);
    }

    return missions;
}
