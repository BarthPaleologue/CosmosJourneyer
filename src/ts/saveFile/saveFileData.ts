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
import { SerializedPlayerSchema } from "../player/serializedPlayer";
import { encodeBase64 } from "../utils/base64";
import { z } from "zod";
import { err, ok, Result } from "../utils/types";
import { alertModal } from "../utils/dialogModal";

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

/**
 * @param schema The schema to use to filter the elements.
 * @param handleDataLoss A function that will be called with the data that was filtered out.
 * @returns A preprocessing lambda that will filter out elements that do not match the schema.
 */
function safeFilter(
    schema: z.ZodSchema<unknown, z.ZodTypeDef, unknown>,
    handleDataLoss: (lostData: { element: unknown; error: z.ZodError<unknown> }[]) => void
): (data: unknown, ctx: z.RefinementCtx) => unknown {
    return (data: unknown, ctx: z.RefinementCtx) => {
        if (!Array.isArray(data)) {
            return data;
        }

        const safeElements: unknown[] = [];
        const filteredData: { element: unknown; error: z.ZodError<unknown> }[] = [];
        for (const element of data) {
            const result = schema.safeParse(element);
            if (!result.success) {
                filteredData.push({ element, error: result.error });
                continue;
            }
            safeElements.push(result.data);
        }

        if (safeElements.length !== data.length) {
            handleDataLoss(filteredData);
        }

        return safeElements;
    };
}

async function handleSaveDataLoss(filteredData: { element: unknown; error: z.ZodError<unknown> }[]): Promise<void> {
    filteredData.forEach(({ element, error }) => {
        console.error("Failed to parse save file data", element, error);
    });

    await alertModal("Some save files could not be validated! Check the console for more information.");
}

export const CmdrSavesSchema = z.object({
    /** The manual saves of the cmdr. */
    manual: z.preprocess(safeFilter(SaveFileSchema, handleSaveDataLoss), z.array(SaveFileSchema)).default([]),

    /** The auto saves of the cmdr. */
    auto: z.preprocess(safeFilter(SaveFileSchema, handleSaveDataLoss), z.array(SaveFileSchema)).default([])
});

export type CmdrSaves = z.infer<typeof CmdrSavesSchema>;

export const SavesSchema = z.record(z.string().uuid(), CmdrSavesSchema);

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
