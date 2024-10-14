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

import { getNeighborStarSystemCoordinates } from "../utils/getNeighborStarSystems";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { newSightSeeingMission } from "./sightSeeingMission";
import { uniformRandBool } from "extended-random";
import { SystemObjectType } from "../saveFile/universeCoordinates";
import { Player } from "../player/player";
import { hasLiquidWater, TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { Mission, MissionType } from "./mission";
import { StarSystemModel, StarSystemModelUtils } from "../starSystem/starSystemModel";
import { getRngFromSeed } from "../utils/getRngFromSeed";
import { getSystemModelFromCoordinates } from "../starSystem/modelFromCoordinates";
import { OrbitalObjectType } from "../architecture/orbitalObject";

/**
 * Generates sightseeing missions available at the given space station for the player. Missions are generated based on the current timestamp (hourly basis).
 * @param spaceStationModel The space station model where the missions are generated
 * @param starSystemModel
 * @param player The player for which the missions are generated
 * @param timestampMillis The current timestamp in milliseconds
 */
export function generateSightseeingMissions(spaceStationModel: SpaceStationModel, starSystemModel: StarSystemModel, player: Player, timestampMillis: number): Mission[] {
    const currentHour = Math.floor(timestampMillis / 1000 / 60 / 60);

    const starSystem = starSystemModel;

    const anomalyFlyByMissions: Mission[] = [];
    const neutronStarFlyByMissions: Mission[] = [];
    const blackHoleFlyByMissions: Mission[] = [];

    const rng = getRngFromSeed(spaceStationModel.seed);

    const neighborSystems = getNeighborStarSystemCoordinates(starSystem.coordinates, 75);
    neighborSystems.forEach(([systemCoordinates, coordinates, distance]) => {
        const systemModel = getSystemModelFromCoordinates(systemCoordinates);
        for (let anomalyIndex = 0; anomalyIndex < StarSystemModelUtils.GetAnomalies(systemModel).length; anomalyIndex++) {
            if (!uniformRandBool(1.0 / (1.0 + 0.4 * distance), rng, 6254 + anomalyIndex + currentHour)) return;
            anomalyFlyByMissions.push(
                newSightSeeingMission(spaceStationModel, {
                    type: MissionType.SIGHT_SEEING_FLY_BY,
                    objectId: {
                        starSystemCoordinates: systemCoordinates,
                        objectType: SystemObjectType.ANOMALY,
                        objectIndex: anomalyIndex
                    }
                })
            );
        }
        StarSystemModelUtils.GetStellarObjects(systemModel).forEach((model, stellarObjectIndex) => {
            if (model.type === OrbitalObjectType.NEUTRON_STAR) {
                neutronStarFlyByMissions.push(
                    newSightSeeingMission(spaceStationModel, {
                        type: MissionType.SIGHT_SEEING_FLY_BY,
                        objectId: {
                            starSystemCoordinates: systemCoordinates,
                            objectType: SystemObjectType.STELLAR_OBJECT,
                            objectIndex: stellarObjectIndex
                        }
                    })
                );
            }
            if (model.type === OrbitalObjectType.BLACK_HOLE) {
                blackHoleFlyByMissions.push(
                    newSightSeeingMission(spaceStationModel, {
                        type: MissionType.SIGHT_SEEING_FLY_BY,
                        objectId: {
                            starSystemCoordinates: systemCoordinates,
                            objectType: SystemObjectType.STELLAR_OBJECT,
                            objectIndex: stellarObjectIndex
                        }
                    })
                );
            }
        });
    });

    // for asteroid field missions, find all asteroid fields in the current system
    const asteroidFieldMissions: Mission[] = [];
    // for terminator landing missions, find all telluric planets with no liquid water
    const terminatorLandingMissions: Mission[] = [];
    const currentSystemModel = starSystem;
    StarSystemModelUtils.GetPlanetaryMassObjects(currentSystemModel).forEach((celestialBodyModel, index) => {
        if (celestialBodyModel.rings !== null) {
            asteroidFieldMissions.push(
                newSightSeeingMission(spaceStationModel, {
                    type: MissionType.SIGHT_SEEING_ASTEROID_FIELD,
                    objectId: {
                        starSystemCoordinates: currentSystemModel.coordinates,
                        objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                        objectIndex: index
                    }
                })
            );
        }

        if (celestialBodyModel.type === OrbitalObjectType.TELLURIC_PLANET) {
            const telluricPlanetModel = celestialBodyModel as TelluricPlanetModel;
            if (!hasLiquidWater(telluricPlanetModel)) {
                terminatorLandingMissions.push(
                    newSightSeeingMission(spaceStationModel, {
                        type: MissionType.SIGHT_SEEING_TERMINATOR_LANDING,
                        objectId: {
                            starSystemCoordinates: currentSystemModel.coordinates,
                            objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                            objectIndex: index
                        }
                    })
                );
            }
        }
    });

    const allMissions = blackHoleFlyByMissions.concat(neutronStarFlyByMissions, anomalyFlyByMissions, asteroidFieldMissions, terminatorLandingMissions);

    // filter missions to avoid duplicates with already accepted missions of the player
    return allMissions.filter((mission) => player.currentMissions.concat(player.completedMissions).every((currentMission) => !mission.equals(currentMission)));
}
