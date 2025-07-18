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

import type { CmdrSaves, Save } from "./saveFileData";

export interface ISaveBackend {
    /**
     * Retrieves saves for a specific commander.
     * @param cmdrUuid - The commander uuid
     * @returns The commander's saves, or undefined if none exist
     */
    getSavesForCmdr(cmdrUuid: string): Promise<CmdrSaves | undefined>;
    deleteSaveForCmdr(cmdrUuid: string, save: Save): Promise<boolean>;
    deleteCmdr(cmdrUuid: string): Promise<boolean>;
    getCmdrUuids(): Promise<Array<string>>;
    addManualSave(cmdrUuid: string, save: Save): Promise<boolean>;
    addAutoSave(cmdrUuid: string, save: Save): Promise<boolean>;
}
