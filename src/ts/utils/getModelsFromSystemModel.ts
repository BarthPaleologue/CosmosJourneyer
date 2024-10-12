import { placeSpaceStations } from "../society/spaceStationPlacement";
import { newSeededSpaceStationModel, SpaceStationModel } from "../spacestation/spacestationModel";
import { getSpaceStationSeed } from "../planets/common";
import { StarSystemModel } from "../starSystem/starSystemModel";

export function getSpaceStationModels(system: StarSystemModel): SpaceStationModel[] {
    const spaceStationParents = placeSpaceStations(system);
    const stellarObjectModels = system.stellarObjects;
    return spaceStationParents.map((planet) => {
        return newSeededSpaceStationModel(getSpaceStationSeed(planet, 0), stellarObjectModels[0], system.coordinates, planet);
    });
}
