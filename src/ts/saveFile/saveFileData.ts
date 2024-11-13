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
