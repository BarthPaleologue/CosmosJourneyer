import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";
import { getNeighborStarSystems } from "../utils/getNeighborStarSystems";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { SightSeeingMission, SightSeeingType } from "./sightSeeingMission";
import { uniformRandBool } from "extended-random";
import { BodyType } from "../architecture/bodyType";
import { SystemObjectType } from "../saveFile/universeCoordinates";
import { Player } from "../player/player";
import { getPlanetaryMassObjectModels } from "../utils/getModelsFromSystemModel";

export function generateSightseeingMissions(spaceStationModel: SpaceStationModel, player: Player, timestampMillis: number): SightSeeingMission[] {
    const hours = Math.floor(timestampMillis / 1000 / 60 / 60);

    const starSystem = spaceStationModel.starSystem;
    if (!(starSystem instanceof SeededStarSystemModel)) {
        throw new Error("Star system is not seeded, hence missions cannot be generated");
    }

    const anomalyFlyByMissions: SightSeeingMission[] = [];
    const neutronStarFlyByMissions: SightSeeingMission[] = [];
    const blackHoleFlyByMissions: SightSeeingMission[] = [];

    const neighborSystems = getNeighborStarSystems(starSystem.seed, 75);
    neighborSystems.forEach(([systemSeed, coordinates, distance]) => {
        const systemModel = new SeededStarSystemModel(systemSeed);
        systemModel.getAnomalies().forEach((_, anomalyIndex) => {
            if (!uniformRandBool(1.0 / (1.0 + 0.4 * distance), systemModel.rng, 6254 + anomalyIndex + hours)) return;
            anomalyFlyByMissions.push(
                new SightSeeingMission(spaceStationModel, {
                    type: SightSeeingType.FLY_BY,
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
                    new SightSeeingMission(spaceStationModel, {
                        type: SightSeeingType.FLY_BY,
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
                    new SightSeeingMission(spaceStationModel, {
                        type: SightSeeingType.FLY_BY,
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
    const asteroidFieldMissions: SightSeeingMission[] = [];
    const currentSystemModel = starSystem;
    getPlanetaryMassObjectModels(currentSystemModel).forEach((celestialBodyModel, index) => {
        if (celestialBodyModel.rings === null) return;

        asteroidFieldMissions.push(
            new SightSeeingMission(spaceStationModel, {
                type: SightSeeingType.ASTEROID_FIELD_TREK,
                objectId: {
                    starSystem: currentSystemModel.seed.serialize(),
                    objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                    index
                }
            })
        );
    });

    const allMissions = blackHoleFlyByMissions.concat(neutronStarFlyByMissions, anomalyFlyByMissions, asteroidFieldMissions);

    // filter missions to avoid duplicates with already accepted missions of the player
    return allMissions.filter((mission) => player.currentMissions.every((currentMission) => !mission.equals(currentMission)));
}
