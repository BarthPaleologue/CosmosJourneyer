import { getNeighborStarSystemCoordinates } from "../utils/getNeighborStarSystems";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { newSightSeeingMission } from "./sightSeeingMission";
import { uniformRandBool } from "extended-random";
import { BodyType } from "../architecture/bodyType";
import { SystemObjectType } from "../saveFile/universeCoordinates";
import { Player } from "../player/player";
import { getPlanetaryMassObjectModels } from "../utils/getModelsFromSystemModel";
import { TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { Mission, MissionType } from "./mission";
import { getSystemModelFromCoordinates } from "../utils/starSystemCoordinatesUtils";

/**
 * Generates sightseeing missions available at the given space station for the player. Missions are generated based on the current timestamp (hourly basis).
 * @param spaceStationModel The space station model where the missions are generated
 * @param player The player for which the missions are generated
 * @param timestampMillis The current timestamp in milliseconds
 */
export function generateSightseeingMissions(spaceStationModel: SpaceStationModel, player: Player, timestampMillis: number): Mission[] {
    const currentHour = Math.floor(timestampMillis / 1000 / 60 / 60);

    const starSystem = spaceStationModel.starSystem;

    const anomalyFlyByMissions: Mission[] = [];
    const neutronStarFlyByMissions: Mission[] = [];
    const blackHoleFlyByMissions: Mission[] = [];

    const neighborSystems = getNeighborStarSystemCoordinates(starSystem.getCoordinates(), 75);
    neighborSystems.forEach(([systemCoordinates, coordinates, distance]) => {
        const systemModel = getSystemModelFromCoordinates(systemCoordinates);
        systemModel.getAnomalies().forEach((_, anomalyIndex) => {
            if (!uniformRandBool(1.0 / (1.0 + 0.4 * distance), systemModel.rng, 6254 + anomalyIndex + currentHour)) return;
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
        });

        systemModel.getStellarObjects().forEach(([bodyType, bodySeed], stellarObjectIndex) => {
            if (bodyType === BodyType.NEUTRON_STAR) {
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
            if (bodyType === BodyType.BLACK_HOLE) {
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
    getPlanetaryMassObjectModels(currentSystemModel).forEach((celestialBodyModel, index) => {
        if (celestialBodyModel.rings !== null) {
            asteroidFieldMissions.push(
                newSightSeeingMission(spaceStationModel, {
                    type: MissionType.SIGHT_SEEING_ASTEROID_FIELD,
                    objectId: {
                        starSystemCoordinates: currentSystemModel.getCoordinates(),
                        objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                        objectIndex: index
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
                            starSystemCoordinates: currentSystemModel.getCoordinates(),
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
