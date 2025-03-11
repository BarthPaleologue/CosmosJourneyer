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

import { Settings } from "../settings";
import { err, ok, Result } from "../utils/types";
import { CmdrSaves, SavesSchema, SaveLoadingError } from "./saveFileData";
import { SaveBackend } from "./saveManager";

export class SaveLocalBackend implements SaveBackend {
    public write(saves: Record<string, CmdrSaves>): boolean {
        localStorage.setItem(Settings.SAVES_KEY, JSON.stringify(saves));

        return true;
    }

    public read(): Result<Record<string, CmdrSaves>, SaveLoadingError> {
        const saves = localStorage.getItem(Settings.SAVES_KEY);
        if (saves === null) {
            return ok({});
        }

        try {
            const parsedSaves = JSON.parse(saves);

            const result = SavesSchema.safeParse(parsedSaves);
            if (!result.success) {
                console.error(result.error);
                return err(SaveLoadingError.INVALID_SAVE);
            }

            return ok(result.data);
        } catch {
            return err(SaveLoadingError.INVALID_JSON);
        }
    }
}
