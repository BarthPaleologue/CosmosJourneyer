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
import projectInfo from "../../../package.json";
import { SerializedPlayerSchema } from "../player/serializedPlayer";
import { UniverseCoordinatesSchema } from "../utils/coordinates/universeCoordinates";
import { Result, ok, err } from "../utils/types";
import { SaveLoadingError, SaveLoadingErrorType } from "./saveLoadingError";

export const SaveSchemaV1 = z.object({
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
export type SaveV1 = z.infer<typeof SaveSchemaV1>;

export function safeParseSaveV1(data: unknown): Result<SaveV1, SaveLoadingError> {
    const result = SaveSchemaV1.safeParse(data);
    if (result.success) {
        return ok(result.data);
    }

    return err({ type: SaveLoadingErrorType.INVALID_SAVE, content: result.error });
}
