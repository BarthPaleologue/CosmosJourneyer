import { UniverseCoordinates } from "../utils/coordinates/universeCoordinates";
import projectInfo from "../../../package.json";
import i18n from "../i18n";

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
     * The timestamp when the save file was created.
     */
    timestamp: number;

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
 * Parses a string into a SaveFileData object. Throws an error if the string is not a valid save file data.
 * @param jsonString The string to parse.
 * @returns The parsed SaveFileData object. Returns null if the string is not valid.
 */
export function parseSaveFileData(jsonString: string): { data: SaveFileData | null; logs: string[] } {
    let saveData: SaveFileData;
    const logs: string[] = [];
    try {
        saveData = JSON.parse(jsonString) as SaveFileData;
    } catch (e) {
        logs.push(i18n.t("notifications:invalidSaveFileJson", { error: e }));
        logs.forEach((log) => console.warn(log));
        return { data: null, logs };
    }

    if (saveData.version !== projectInfo.version) {
        logs.push(
            i18n.t("notifications:saveVersionMismatch", {
                currentVersion: projectInfo.version,
                saveVersion: saveData.version
            })
        );
    }

    logs.forEach((log) => console.warn(log));
    return { data: saveData, logs };
}

/**
 * Describes the structure of the local storage manual saves object.
 * Each cmdr has a unique key and the value is an array of save file data.
 */
export type LocalStorageManualSaves = { [key: string]: SaveFileData[] };

/**
 * Describes the structure of the local storage auto saves object.
 * Each cmdr has a unique key and the value is a save file data. Auto saves are overwritten on each auto save.
 */
export type LocalStorageAutoSaves = { [key: string]: SaveFileData[] };
