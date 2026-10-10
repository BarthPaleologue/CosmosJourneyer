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

import { err, ok } from "@cosmos-journeyer/typescript";
import type { Assert, DeepMutable, DeepReadonly, Result, StrictEqual } from "@cosmos-journeyer/typescript";
import { z } from "zod";

import { encodeBase64 } from "@/utils/base64";

import { SerializedPlayerSchema } from "../player/serializedPlayer";
import type { SaveLoadingError } from "./saveLoadingError";
import { UniverseCoordinatesSchema } from "./universeCoordinates";

export const SaveSchema = z.object({
    uuid: z.string().default(() => crypto.randomUUID()),

    /** The timestamp when the save file was created. */
    timestamp: z.number().default(() => Date.now()),

    /** The player data. */
    player: SerializedPlayerSchema,

    playerLocation: UniverseCoordinatesSchema,

    shipLocations: z.record(z.uuid(), UniverseCoordinatesSchema),

    thumbnail: z.string().optional(),
});

/**
 * Data structure for the save file to allow restoring current star system and position.
 */
export type Save = z.infer<typeof SaveSchema>;

export function safeParseSave(json: Record<string, unknown>): Result<Save, SaveLoadingError> {
    const result = SaveSchema.safeParse(json);
    if (result.success) {
        return ok(result.data);
    }

    return err({ type: "INVALID_SAVE", content: result.error });
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

export function parseSaveArray(rawSaves: Record<string, unknown>[]): {
    validSaves: Save[];
    invalidSaves: { save: unknown; error: SaveLoadingError }[];
} {
    const validSaves: Save[] = [];
    const invalidSaves: { save: unknown; error: SaveLoadingError }[] = [];

    for (const save of rawSaves) {
        const result = safeParseSave(save);
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

export const SavesSchema = z.record(z.uuid(), CmdrSavesShallowSchema);
