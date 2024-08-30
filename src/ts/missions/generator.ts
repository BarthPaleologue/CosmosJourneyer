import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";
import { getNeighborStarSystems } from "../utils/getNeighborStarSystems";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { SightSeeingMission, SightSeeingType } from "./sightSeeingMission";
import { uniformRandBool } from "extended-random";
import { BodyType } from "../architecture/bodyType";
import { SystemObjectType } from "../saveFile/universeCoordinates";

export function generateSightseeingMissions(spaceStationModel: SpaceStationModel, timestampMillis: number): SightSeeingMission[] {
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

    return blackHoleFlyByMissions.concat(neutronStarFlyByMissions, anomalyFlyByMissions);
}
