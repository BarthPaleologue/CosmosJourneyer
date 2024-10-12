import { SpaceStationModel } from "../spacestation/spacestationModel";
import { StarSystemModel } from "../starSystem/starSystemModel";

export function getSpaceStationModels(system: StarSystemModel): SpaceStationModel[] {
    return system.spaceStations.map((station) => station.model);
}
