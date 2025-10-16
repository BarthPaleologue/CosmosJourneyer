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

import { z } from "zod";

import { type UniverseBackend } from "@/backend/universe/universeBackend";

import { encodeBase64 } from "@/utils/base64";
import { type Assert, type DeepMutable, type DeepReadonly, type Result, type StrictEqual } from "@/utils/types";

import { type SaveLoadingError } from "./saveLoadingError";
import { safeParseSaveV2, SaveSchemaV2 } from "./v2/saveV2";

export const SaveSchema = SaveSchemaV2;

export type Save = z.infer<typeof SaveSchema>;

/**
 * Parses a string into a SaveFileData object. Throws an error if the string is not a valid save file data.
 * @param json The string to parse.
 * @returns The parsed SaveFileData object. Returns null if the string is not valid.
 */
export function safeParseSave(
    json: Record<string, unknown>,
    universeBackend: UniverseBackend,
): Result<Save, SaveLoadingError> {
    return safeParseSaveV2(json, universeBackend);
}

export function createUrlFromSave(save: DeepReadonly<Save>): URL | null {
    const urlRoot = window.location.href.split("?")[0];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { thumbnail, ...saveWithoutThumbnail } = save;
    const saveString = encodeBase64(JSON.stringify(saveWithoutThumbnail));
    if (saveString === null) {
        return null;
    }

    return new URL(`${urlRoot}?save=${saveString}`);
}

export function parseSaveArray(
    rawSaves: Record<string, unknown>[],
    universeBackend: UniverseBackend,
): { validSaves: Save[]; invalidSaves: { save: unknown; error: SaveLoadingError }[] } {
    const validSaves: Save[] = [];
    const invalidSaves: { save: unknown; error: SaveLoadingError }[] = [];

    for (const save of rawSaves) {
        const result = safeParseSave(save, universeBackend);
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
    auto: z.array(z.record(z.string(), z.unknown())),
});

export const CmdrSavesDeepSchema = CmdrSavesShallowSchema.extend({
    /** The manual saves of the cmdr. */
    manual: z.array(SaveSchema),

    /** The auto saves of the cmdr. */
    auto: z.array(SaveSchema),
});

export type CmdrSaves = {
    manual: Array<DeepReadonly<Save>>;
    auto: Array<DeepReadonly<Save>>;
};

export type CmdrSavesShapeIsStable = Assert<StrictEqual<DeepMutable<CmdrSaves>, z.infer<typeof CmdrSavesDeepSchema>>>;

export const SavesSchema = z.record(z.string().uuid(), CmdrSavesShallowSchema);
