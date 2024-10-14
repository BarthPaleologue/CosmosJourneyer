import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";
import { newSeededStarSystemModel } from "./seededStarSystemModel";
import { getSeedFromCoordinates } from "./systemSeed";

export function getSystemModelFromCoordinates(coordinates: StarSystemCoordinates) {
    const seed = getSeedFromCoordinates(coordinates);
    if (seed === null) {
        throw new Error("No seed found for coordinates. Custom star systems are not supported in system targets yet.");
    }
    return newSeededStarSystemModel(seed);
}
