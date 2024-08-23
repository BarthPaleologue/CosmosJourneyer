import { placeSpaceStations } from "../society/spaceStationPlacement";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { getSpaceStationSeed } from "../planets/common";
import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";

export function getSpaceStationModels(system: SeededStarSystemModel) {
    const spaceStationParents = placeSpaceStations(system);
    return spaceStationParents.map((planet) => {
        return new SpaceStationModel(getSpaceStationSeed(planet, 0), system, planet);
    });
}