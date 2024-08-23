import { isJsonStringValidUniverseCoordinates, UniverseCoordinates } from "./universeCoordinates";
import { SerializedPlayer } from "../player/player";

/**
 * Data structure for the save file to allow restoring current star system and position.
 */
export type SaveFileData = {
    /**
     * The version of CosmosJourneyer that created this save file.
     */
    version: string;

    /**
     * The player data.
     */
    player: SerializedPlayer;

    /**
     * The coordinates of the current star system and the coordinates inside the star system.
     */
    universeCoordinates: UniverseCoordinates;

    /**
     * If the player is landed at a facility, store the pad number to allow graceful respawn at the station
     */
    padNumber?: number;
};

/**
 * Checks if a string is a valid save file json data.
 * @param jsonString The string to check.
 */
export function isJsonStringValidSaveFileData(jsonString: string): boolean {
    try {
        const data = JSON.parse(jsonString);
        if (typeof data !== "object") return false;

        if (typeof data.version !== "string") return false;

        if (typeof data.universeCoordinates !== "object") return false;

        if (!isJsonStringValidUniverseCoordinates(JSON.stringify(data.universeCoordinates))) return false;

        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Parses a string into a SaveFileData object. Throws an error if the string is not a valid save file data.
 * @param jsonString The string to parse.
 * @throws Error if the string is not a valid save file data.
 */
export function parseSaveFileData(jsonString: string): SaveFileData {
    if (!isJsonStringValidSaveFileData(jsonString)) throw new Error("Invalid save file data");

    return JSON.parse(jsonString);
}
