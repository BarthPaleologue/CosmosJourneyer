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

import { UniverseCoordinatesSchema } from "../utils/coordinates/universeCoordinates";
import projectInfo from "../../../package.json";
import i18n from "../i18n";
import { SerializedPlayerSchema } from "../player/player";
import { encodeBase64 } from "../utils/base64";
import { Settings } from "../settings";
import { z } from "zod";
import { downloadTextFile } from "../utils/download";
import { err, ok, Result } from "../utils/types";

export const SaveFileSchema = z.object({
    /** The version of CosmosJourneyer that created this save file. */
    version: z.string().default(projectInfo.version),

    /** The timestamp when the save file was created. */
    timestamp: z.number().default(Date.now()),

    /** The player data. */
    player: SerializedPlayerSchema,

    /** The coordinates of the current star system and the coordinates inside the star system. */
    universeCoordinates: UniverseCoordinatesSchema,

    /** If the player is landed at a facility, store the pad number to allow graceful respawn at the station. */
    padNumber: z.number().optional()
});

/**
 * Data structure for the save file to allow restoring current star system and position.
 */
export type SaveFileData = z.infer<typeof SaveFileSchema>;

/**
 * Parses a string into a SaveFileData object. Throws an error if the string is not a valid save file data.
 * @param jsonString The string to parse.
 * @returns The parsed SaveFileData object. Returns null if the string is not valid.
 */
export function parseSaveFileData(jsonString: string): Result<SaveFileData, SaveLoadingError> {
    try {
        const validJsonString = JSON.parse(jsonString);
        const saveData = SaveFileSchema.parse(validJsonString);

        return ok(saveData);
    } catch {
        return err(SaveLoadingError.INVALID_JSON);
    }
}

export function createUrlFromSave(data: SaveFileData): URL {
    const urlRoot = window.location.href.split("?")[0];
    const saveString = encodeBase64(JSON.stringify(data));
    return new URL(`${urlRoot}?save=${saveString}`);
}

export const CmdrSavesSchema = z.object({
    /** The manual saves of the cmdr. */
    manualSaves: z.array(SaveFileSchema).default([]),

    /** The auto saves of the cmdr. */
    autoSaves: z.array(SaveFileSchema).default([])
});

export type CmdrSaves = z.infer<typeof CmdrSavesSchema>;

export const LocalStorageSavesSchema = z.record(z.string().uuid(), CmdrSavesSchema).default({});

/** Describes the structure of the local storage saves object. */
export type LocalStorageSaves = Map<string, CmdrSaves>;

export const enum SaveLoadingError {
    INVALID_JSON = "INVALID_JSON",
    INVALID_SAVE = "INVALID_SAVE"
}

export function saveLoadingErrorToI18nString(error: SaveLoadingError): string {
    switch (error) {
        case SaveLoadingError.INVALID_JSON:
            return i18n.t("notifications:invalidSaveFileJson");
        case SaveLoadingError.INVALID_SAVE:
            return i18n.t("notifications:invalidSaveFile");
    }
}

export function getSavesFromLocalStorage(): Result<LocalStorageSaves, SaveLoadingError> {
    const saves = localStorage.getItem(Settings.SAVES_KEY);
    if (saves === null) {
        return ok(new Map());
    }

    try {
        const parsedSaves = JSON.parse(saves);

        const result = LocalStorageSavesSchema.safeParse(parsedSaves);
        if (!result.success) {
            downloadTextFile(
                `
# Cosmos Journeyer v${projectInfo.version} Error Report

Failed to parse saves from local storage. You can report this error with this file to https://github.com/BarthPaleologue/CosmosJourneyer/issues

## Error

${result.error}

## Save data

${saves}`,
                "cosmos-journeyer-save-parse-error-report.txt"
            );

            return err(SaveLoadingError.INVALID_SAVE);
        }

        const savesMap = new Map<string, CmdrSaves>();
        for (const [cmdrName, cmdrSaves] of Object.entries(result.data)) {
            savesMap.set(cmdrName, cmdrSaves);
        }

        return ok(savesMap);
    } catch {
        return err(SaveLoadingError.INVALID_JSON);
    }
}

export function writeSavesToLocalStorage(saves: LocalStorageSaves): void {
    const savesJson: Record<string, CmdrSaves> = {};
    for (const [cmdrName, cmdrSaves] of saves) {
        savesJson[cmdrName] = cmdrSaves;
    }

    localStorage.setItem(Settings.SAVES_KEY, JSON.stringify(savesJson));
}
