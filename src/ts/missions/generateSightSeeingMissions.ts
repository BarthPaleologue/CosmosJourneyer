import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";
import { getNeighborStarSystems } from "../utils/getNeighborStarSystems";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { newSightSeeingMission } from "./sightSeeingMission";
import { uniformRandBool } from "extended-random";
import { BodyType } from "../architecture/bodyType";
import { SystemObjectType } from "../saveFile/universeCoordinates";
import { Player } from "../player/player";
import { getPlanetaryMassObjectModels } from "../utils/getModelsFromSystemModel";
import { TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { Mission, MissionType } from "./mission";

/**
 * Generates sightseeing missions available at the given space station for the player. Missions are generated based on the current timestamp (hourly basis).
 * @param spaceStationModel The space station model where the missions are generated
 * @param player The player for which the missions are generated
 * @param timestampMillis The current timestamp in milliseconds
 */
export function generateSightseeingMissions(spaceStationModel: SpaceStationModel, player: Player, timestampMillis: number): Mission[] {
    const currentHour = Math.floor(timestampMillis / 1000 / 60 / 60);

    const starSystem = spaceStationModel.starSystem;
    if (!(starSystem instanceof SeededStarSystemModel)) {
        throw new Error("Star system is not seeded, hence missions cannot be generated");
    }

    const anomalyFlyByMissions: Mission[] = [];
    const neutronStarFlyByMissions: Mission[] = [];
    const blackHoleFlyByMissions: Mission[] = [];

    const neighborSystems = getNeighborStarSystems(starSystem.seed, 75);
    neighborSystems.forEach(([systemSeed, coordinates, distance]) => {
        const systemModel = new SeededStarSystemModel(systemSeed);
        systemModel.getAnomalies().forEach((_, anomalyIndex) => {
            if (!uniformRandBool(1.0 / (1.0 + 0.4 * distance), systemModel.rng, 6254 + anomalyIndex + currentHour)) return;
            anomalyFlyByMissions.push(
                newSightSeeingMission(spaceStationModel, {
                    type: MissionType.SIGHT_SEEING_FLY_BY,
                    objectId: {
                        starSystem: systemSeed.serialize(),
                        objectType: SystemObjectType.ANOMALY,
                        index: anomalyIndex
                    }
                })
            );
        });

        systemModel.getStellarObjects().forEach(([bodyType, bodySeed], stellarObjectIndex) => {
            if (bodyType === BodyType.NEUTRON_STAR) {
                neutronStarFlyByMissions.push(
                    newSightSeeingMission(spaceStationModel, {
                        type: MissionType.SIGHT_SEEING_FLY_BY,
                        objectId: {
                            starSystem: systemSeed.serialize(),
                            objectType: SystemObjectType.STELLAR_OBJECT,
                            index: stellarObjectIndex
                        }
                    })
                );
            }
            if (bodyType === BodyType.BLACK_HOLE) {
                blackHoleFlyByMissions.push(
                    newSightSeeingMission(spaceStationModel, {
                        type: MissionType.SIGHT_SEEING_FLY_BY,
                        objectId: {
                            starSystem: systemSeed.serialize(),
                            objectType: SystemObjectType.STELLAR_OBJECT,
                            index: stellarObjectIndex
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
    getPlanetaryMassObjectModels(currentSystemModel).forEach((celestialBodyModel, index) => {
        if (celestialBodyModel.rings !== null) {
            asteroidFieldMissions.push(
                newSightSeeingMission(spaceStationModel, {
                    type: MissionType.SIGHT_SEEING_ASTEROID_FIELD,
                    objectId: {
                        starSystem: currentSystemModel.seed.serialize(),
                        objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                        index
                    }
                })
            );
        }

        if (celestialBodyModel.bodyType === BodyType.TELLURIC_PLANET) {
            const telluricPlanetModel = celestialBodyModel as TelluricPlanetModel;
            if (!telluricPlanetModel.hasLiquidWater() && !telluricPlanetModel.isMoon()) {
                terminatorLandingMissions.push(
                    newSightSeeingMission(spaceStationModel, {
                        type: MissionType.SIGHT_SEEING_TERMINATOR_LANDING,
                        objectId: {
                            starSystem: currentSystemModel.seed.serialize(),
                            objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                            index
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
