//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { UniverseCoordinates } from "../utils/coordinates/universeCoordinates";
import projectInfo from "../../../package.json";
import i18n from "../i18n";
import { SerializedPlayer } from "../player/player";
import { encodeBase64 } from "../utils/base64";
import { Settings } from "../settings";

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
export function parseSaveFileData(jsonString: string): {
    data: SaveFileData | null;
    logs: string[];
} {
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

export function createUrlFromSave(data: SaveFileData): URL {
    const urlRoot = window.location.href.split("?")[0];
    const saveString = encodeBase64(JSON.stringify(data));
    return new URL(`${urlRoot}?save=${saveString}`);
}

/**
 * Describes the structure of the local storage saves object.
 */
export type LocalStorageSaves = {
    [uuid: string]: {
        /**
         * The manual saves of the cmdr.
         */
        manual: SaveFileData[];
        /**
         * The auto saves of the cmdr.
         */
        auto: SaveFileData[];
    };
};

export function getSavesFromLocalStorage(): LocalStorageSaves {
    return JSON.parse(localStorage.getItem(Settings.SAVES_KEY) ?? "{}");
}

export function writeSavesToLocalStorage(saves: LocalStorageSaves): void {
    localStorage.setItem(Settings.SAVES_KEY, JSON.stringify(saves));
}
