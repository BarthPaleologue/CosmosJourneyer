import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";
import { newSeededStarSystemModel } from "./seededStarSystemModel";
import { getSeedFromCoordinates } from "./systemSeed";
import { CustomSystemRegistry } from "./customSystemRegistry";

export function getSystemModelFromCoordinates(coordinates: StarSystemCoordinates) {
    const customSystem = CustomSystemRegistry.GetSystemFromCoordinates(coordinates);
    if (customSystem !== undefined) {
        return customSystem;
    }

    const seed = getSeedFromCoordinates(coordinates);
    if (seed === null) {
        throw new Error(`Seed not found for coordinates ${JSON.stringify(coordinates)}. It was not found in the custom system registry either.`);
    }
    return newSeededStarSystemModel(seed);
}
