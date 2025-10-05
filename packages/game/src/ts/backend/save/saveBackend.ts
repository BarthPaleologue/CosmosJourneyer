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

import type { CmdrSaves, Save } from "./saveFileData";

export interface ISaveBackend {
    /**
     * Retrieves saves for a specific commander.
     * @param cmdrUuid - The commander uuid
     * @returns The commander's saves, or undefined if none exist
     */
    getSavesForCmdr(cmdrUuid: string): Promise<CmdrSaves | undefined>;

    /**
     * Deletes the given save for the commander
     * @param cmdrUuid The cmdr uuid
     * @param saveUuid The uuid of the save to remove
     */
    deleteSaveForCmdr(cmdrUuid: string, saveUuid: string): Promise<boolean>;

    /**
     * Removes a commander and all its saves
     * @param cmdrUuid The cmdr uuid
     */
    deleteCmdr(cmdrUuid: string): Promise<boolean>;

    /**
     * @returns The uuids of all the commanders stored in the backend
     */
    getCmdrUuids(): Promise<Array<string>>;

    /**
     * Adds a new manual save to the backend for the given commander
     * @param cmdrUuid The uuid of the commander
     * @param save The save to add
     */
    addManualSave(cmdrUuid: string, save: DeepReadonly<Save>): Promise<boolean>;

    /**
     * Adds a new auto save to the backend for the given commander
     * @param cmdrUuid The uuid of the commander
     * @param save The save to add
     */
    addAutoSave(cmdrUuid: string, save: DeepReadonly<Save>): Promise<boolean>;

    /**
     * Imports the given saves in the backend
     * @param saves The saves to import
     */
    importSaves(saves: DeepReadonly<Record<string, CmdrSaves>>): Promise<boolean>;

    /**
     * @returns A record of commander's saves, where the key is the cmdr uuid
     */
    exportSaves(): Promise<Record<string, CmdrSaves>>;
}
