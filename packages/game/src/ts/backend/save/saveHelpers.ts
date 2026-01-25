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

import type { DeepReadonly } from "@/utils/types";

import type { ISaveBackend } from "./saveBackend";
import type { Save } from "./saveFileData";

export async function getLatestSaveFromBackend(saveBackend: ISaveBackend): Promise<DeepReadonly<Save> | null> {
    const cmdrUuids = await saveBackend.getCmdrUuids();

    let latestSave: DeepReadonly<Save> | null = null;
    let latestTimestamp = -Infinity;

    for (const cmdrUuid of cmdrUuids) {
        const cmdrSaves = await saveBackend.getSavesForCmdr(cmdrUuid);
        if (cmdrSaves === undefined) {
            continue;
        }

        const allSaves = cmdrSaves.manual.concat(cmdrSaves.auto);
        for (const save of allSaves) {
            if (save.timestamp > latestTimestamp) {
                latestTimestamp = save.timestamp;
                latestSave = save;
            }
        }
    }

    return latestSave;
}
