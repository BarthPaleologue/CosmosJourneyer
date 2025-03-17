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

import { encodeBase64 } from "../utils/base64";
import { z } from "zod";
import { Result } from "../utils/types";
import { SaveLoadingError } from "./saveLoadingError";
import { safeParseSaveV2, SaveSchemaV2 } from "./v2/saveV2";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";

export const SaveSchema = SaveSchemaV2;

export type Save = z.infer<typeof SaveSchema>;

/**
 * Parses a string into a SaveFileData object. Throws an error if the string is not a valid save file data.
 * @param json The string to parse.
 * @returns The parsed SaveFileData object. Returns null if the string is not valid.
 */
export function safeParseSave(
    json: Record<string, unknown>,
    starSystemDatabase: StarSystemDatabase
): Result<Save, SaveLoadingError> {
    return safeParseSaveV2(json, starSystemDatabase);
}

export function createUrlFromSave(data: Save): URL {
    const urlRoot = window.location.href.split("?")[0];
    const saveString = encodeBase64(JSON.stringify(data));
    return new URL(`${urlRoot}?save=${saveString}`);
}

export function parseSaveArray(
    rawSaves: Record<string, unknown>[],
    starSystemDatabase: StarSystemDatabase
): { validSaves: Save[]; invalidSaves: { save: unknown; error: SaveLoadingError }[] } {
    const validSaves: Save[] = [];
    const invalidSaves: { save: unknown; error: SaveLoadingError }[] = [];

    for (const save of rawSaves) {
        const result = safeParseSave(save, starSystemDatabase);
        if (result.success) {
            validSaves.push(result.value);
        } else {
            invalidSaves.push({ save, error: result.error });
        }
    }

    return { validSaves, invalidSaves };
}

export const CmdrSavesShallowSchema = z.object({
    /** The manual saves of the cmdr. */
    manual: z.array(z.record(z.string(), z.unknown())),

    /** The auto saves of the cmdr. */
    auto: z.array(z.record(z.string(), z.unknown()))
});

export const CmdrSavesDeepSchema = CmdrSavesShallowSchema.extend({
    /** The manual saves of the cmdr. */
    manual: z.array(SaveSchema),

    /** The auto saves of the cmdr. */
    auto: z.array(SaveSchema)
});

export type CmdrSaves = z.infer<typeof CmdrSavesDeepSchema>;

export const SavesSchema = z.record(z.string().uuid(), CmdrSavesShallowSchema);
