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

import { alertModal } from "../utils/dialogModal";
import { jsonSafeParse } from "../utils/json";
import { err, ok, Result } from "../utils/types";
import { CmdrSaves, Save, SavesSchema, parseSaveArray } from "./saveFileData";
import { SaveLoadingError, SaveLoadingErrorType } from "./saveLoadingError";
import { SaveBackend } from "./saveManager";

export class SaveLocalBackend implements SaveBackend {
    public static readonly SAVES_KEY = "saves";
    public static readonly BACKUP_SAVE_KEY = "backupSaves";

    public write(saves: Record<string, CmdrSaves>): boolean {
        localStorage.setItem(SaveLocalBackend.SAVES_KEY, JSON.stringify(saves));

        return true;
    }

    public async read(): Promise<Result<Record<string, CmdrSaves>, SaveLoadingError>> {
        const rawSaves = localStorage.getItem(SaveLocalBackend.SAVES_KEY);
        const rawBackupSaves = localStorage.getItem(SaveLocalBackend.BACKUP_SAVE_KEY);
        if (rawSaves === null && rawBackupSaves === null) {
            return ok({});
        }

        const parsedSaves = jsonSafeParse(rawSaves ?? "{}");
        if (parsedSaves === null) {
            return err({ type: SaveLoadingErrorType.INVALID_JSON });
        }

        const parsedBackupSaves = jsonSafeParse(rawBackupSaves ?? "{}");
        if (parsedBackupSaves === null) {
            return err({ type: SaveLoadingErrorType.INVALID_JSON });
        }

        const savesResult = SavesSchema.safeParse(parsedSaves);
        if (!savesResult.success) {
            console.error(savesResult.error);
            return err({ type: SaveLoadingErrorType.INVALID_STORAGE_FORMAT, content: savesResult.error });
        }

        const backupSavesResult = SavesSchema.safeParse(parsedBackupSaves);
        if (!backupSavesResult.success) {
            console.error(backupSavesResult.error);
            return err({ type: SaveLoadingErrorType.INVALID_STORAGE_FORMAT, content: backupSavesResult.error });
        }

        const saves = savesResult.data;
        const backupSaves = backupSavesResult.data;

        const allSaves = {
            ...saves,
            ...backupSaves
        };

        const correctSaves: Record<string, { manual: Save[]; auto: Save[] }> = {};
        const corruptedSaves: Record<string, { manual: unknown[]; auto: unknown[] }> = {};

        // filter saves
        for (const [cmdrUuid, cmdrSaves] of Object.entries(allSaves)) {
            const parsedManualSaves = parseSaveArray(cmdrSaves.manual);
            const parsedAutoSaves = parseSaveArray(cmdrSaves.auto);

            correctSaves[cmdrUuid] = {
                manual: parsedManualSaves.validSaves,
                auto: parsedAutoSaves.validSaves
            };

            if (parsedManualSaves.invalidSaves.length > 0 || parsedAutoSaves.invalidSaves.length > 0) {
                corruptedSaves[cmdrUuid] = {
                    manual: parsedManualSaves.invalidSaves,
                    auto: parsedAutoSaves.invalidSaves
                };
            }
        }

        if (Object.keys(corruptedSaves).length > 0) {
            console.error("Corrupted saves:", corruptedSaves);
            localStorage.setItem(SaveLocalBackend.BACKUP_SAVE_KEY, JSON.stringify(corruptedSaves));
            await alertModal("Some save files could not be validated! Check the console for more information.");
        } else {
            localStorage.removeItem(SaveLocalBackend.BACKUP_SAVE_KEY);
        }

        return ok(correctSaves);
    }
}
