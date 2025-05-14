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

import { StarSystemDatabase } from "../starSystem/starSystemDatabase";
import { ok, Result } from "../utils/types";
import { CmdrSaves, Save } from "./saveFileData";
import { SaveLoadingError } from "./saveLoadingError";

/**
 * Interface defining the storage backend for save data.
 */
export interface SaveBackend {
    /**
     * Writes save data to the storage backend.
     * @param saves - Record of commander saves, keyed by commander string
     * @returns Boolean indicating success or failure of the write operation
     */
    write(saves: Record<string, CmdrSaves>): boolean;

    /**
     * Reads save data from the storage backend.
     * @returns Result containing either the loaded saves or an error
     */
    read(starSystemDatabase: StarSystemDatabase): Promise<Result<Record<string, CmdrSaves>, SaveLoadingError>>;
}

/**
 * Manages save data for the game, handling reading, writing, and
 * retrieving commander-specific saves through a storage backend.
 */
export class SaveManager {
    /**
     * The storage backend used for persisting save data
     * @private
     */
    private readonly backend: SaveBackend;

    /**
     * Map storing commander saves, keyed by commander string
     * @private
     */
    private readonly saves: Map<string, CmdrSaves>;

    /**
     * Creates a new SaveManager instance.
     * @param backend - The storage backend to use
     * @param saves - Map of commander saves
     * @private
     */
    private constructor(backend: SaveBackend, saves: Map<string, CmdrSaves>) {
        this.backend = backend;
        this.saves = saves;
    }

    /**
     * Factory method to create a SaveManager instance.
     * Reads save data from the provided backend and initializes the manager.
     * @param backend - The storage backend to use
     * @returns Result containing either the created SaveManager or an error
     */
    public static async CreateAsync(
        backend: SaveBackend,
        starSystemDatabase: StarSystemDatabase,
    ): Promise<Result<SaveManager, SaveLoadingError>> {
        const saveResult = await backend.read(starSystemDatabase);
        if (!saveResult.success) {
            return saveResult;
        }

        const savesMap = new Map<string, CmdrSaves>();
        for (const [cmdrId, cmdrSaves] of Object.entries(saveResult.value)) {
            if (cmdrSaves.manual.length === 0 && cmdrSaves.auto.length === 0) {
                continue;
            }

            savesMap.set(cmdrId, cmdrSaves);
        }

        return ok(new SaveManager(backend, savesMap));
    }

    /**
     * Retrieves saves for a specific commander.
     * @param cmdrId - The commander identifier string
     * @returns The commander's saves, or undefined if none exist
     */
    public getSavesForCmdr(cmdrId: string): CmdrSaves | undefined {
        return this.saves.get(cmdrId);
    }

    /**
     * Persists the current saves to the storage backend.
     * @returns Boolean indicating success or failure of the save operation
     */
    public save(): boolean {
        const savesJson = Object.fromEntries(this.saves);
        return this.backend.write(savesJson);
    }

    public renameCmdr(cmdrUuid: string, newName: string): void {
        const cmdrSaves = this.saves.get(cmdrUuid);
        if (cmdrSaves === undefined) {
            return;
        }

        cmdrSaves.manual.forEach((save) => (save.player.name = newName));
        cmdrSaves.auto.forEach((save) => (save.player.name = newName));
    }

    public deleteSaveForCmdr(cmdrUuid: string, save: Save): void {
        const cmdrSaves = this.saves.get(cmdrUuid);
        if (cmdrSaves === undefined) {
            return;
        }

        const manualIndex = cmdrSaves.manual.findIndex((s) => s === save);
        if (manualIndex !== -1) {
            cmdrSaves.manual.splice(manualIndex, 1);
            return;
        }

        const autoIndex = cmdrSaves.auto.findIndex((s) => s === save);
        if (autoIndex !== -1) {
            cmdrSaves.auto.splice(autoIndex, 1);
        }
    }

    public deleteCmdr(cmdrUuid: string): void {
        this.saves.delete(cmdrUuid);
    }

    public getCmdrUuids(): string[] {
        return [...this.saves.keys()];
    }

    public setCmdrSaves(cmdrUuid: string, cmdrSaves: CmdrSaves): void {
        this.saves.set(cmdrUuid, cmdrSaves);
    }
}
