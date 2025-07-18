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

import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { jsonSafeParse } from "@/utils/json";
import { err, ok, type Result } from "@/utils/types";

import { Settings } from "@/settings";

import { parseSaveArray, SavesSchema, type CmdrSaves, type Save } from "./saveFileData";
import { SaveLoadingErrorType, type SaveLoadingError } from "./saveLoadingError";

/**
 * Interface defining the storage backend for save data.
 */
export interface SaveBackend {
    /**
     * Writes save data to the storage backend.
     * @param saves - Record of commander saves, keyed by commander string
     * @returns Boolean indicating success or failure of the write operation
     */
    write(content: string): boolean;

    writeBackup(content: string): boolean;

    /**
     * Reads save data from the storage backend.
     * @returns Result containing either the loaded saves or an error
     */
    read(): Promise<string | null>;

    readBackup(): Promise<string | null>;
}

export interface ISaveManager {
    /**
     * Retrieves saves for a specific commander.
     * @param cmdrId - The commander identifier string
     * @returns The commander's saves, or undefined if none exist
     */
    getSavesForCmdr(cmdrId: string): Promise<CmdrSaves | undefined>;
    deleteSaveForCmdr(cmdrUuid: string, save: Save): Promise<void>;
    deleteCmdr(cmdrUuid: string): Promise<void>;
    getCmdrUuids(): Promise<Array<string>>;
    addManualSave(cmdrUuid: string, save: Save): Promise<boolean>;
    addAutoSave(cmdrUuid: string, save: Save): Promise<boolean>;
}

/**
 * Manages save data for the game, handling reading, writing, and
 * retrieving commander-specific saves through a storage backend.
 */
export class SaveManager implements ISaveManager {
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
        const rawSaves = await backend.read();
        const rawBackupSaves = await backend.readBackup();
        if (rawSaves === null && rawBackupSaves === null) {
            return Promise.resolve(ok({}));
        }

        const parsedSaves = jsonSafeParse(rawSaves ?? "{}");
        if (parsedSaves === null) {
            return Promise.resolve(err({ type: SaveLoadingErrorType.INVALID_JSON }));
        }

        const parsedBackupSaves = jsonSafeParse(rawBackupSaves ?? "{}");
        if (parsedBackupSaves === null) {
            return Promise.resolve(err({ type: SaveLoadingErrorType.INVALID_JSON }));
        }

        const savesResult = SavesSchema.safeParse(parsedSaves);
        if (!savesResult.success) {
            console.error(savesResult.error);
            return Promise.resolve(
                err({ type: SaveLoadingErrorType.INVALID_STORAGE_FORMAT, content: savesResult.error }),
            );
        }

        const backupSavesResult = SavesSchema.safeParse(parsedBackupSaves);
        if (!backupSavesResult.success) {
            console.error(backupSavesResult.error);
            return Promise.resolve(
                err({ type: SaveLoadingErrorType.INVALID_STORAGE_FORMAT, content: backupSavesResult.error }),
            );
        }

        const saves = savesResult.data;
        const backupSaves = backupSavesResult.data;

        const allSaves = {
            ...saves,
            ...backupSaves,
        };

        const correctSaves: Record<string, { manual: Save[]; auto: Save[] }> = {};
        const corruptedSaves: Record<string, { manual: unknown[]; auto: unknown[] }> = {};

        // filter saves
        for (const [cmdrUuid, cmdrSaves] of Object.entries(allSaves)) {
            const parsedManualSaves = parseSaveArray(cmdrSaves.manual, starSystemDatabase);
            const parsedAutoSaves = parseSaveArray(cmdrSaves.auto, starSystemDatabase);

            correctSaves[cmdrUuid] = {
                manual: parsedManualSaves.validSaves,
                auto: parsedAutoSaves.validSaves,
            };

            if (parsedManualSaves.invalidSaves.length > 0 || parsedAutoSaves.invalidSaves.length > 0) {
                corruptedSaves[cmdrUuid] = {
                    manual: parsedManualSaves.invalidSaves.map((save) => {
                        console.error("Corrupted manual save:", save.save, save.error);
                        return save.save;
                    }),
                    auto: parsedAutoSaves.invalidSaves.map((save) => {
                        console.error("Corrupted auto save:", save.save, save.error);
                        return save.save;
                    }),
                };
            }
        }

        backend.writeBackup(JSON.stringify(corruptedSaves));

        if (Object.keys(corruptedSaves).length > 0) {
            console.warn("Some save files could not be validated! Check the console for more information.");
        }

        const savesMap = new Map<string, CmdrSaves>();
        for (const [cmdrId, cmdrSaves] of Object.entries(saves)) {
            if (cmdrSaves.manual.length === 0 && cmdrSaves.auto.length === 0) {
                continue;
            }

            savesMap.set(cmdrId, cmdrSaves);
        }

        return ok(new SaveManager(backend, savesMap));
    }

    public getSavesForCmdr(cmdrId: string): Promise<CmdrSaves | undefined> {
        return Promise.resolve(this.saves.get(cmdrId));
    }

    /**
     * Persists the current saves to the storage backend.
     * @returns Boolean indicating success or failure of the save operation
     */
    private save(): boolean {
        const savesJson = Object.fromEntries(this.saves);
        return this.backend.write(JSON.stringify(savesJson));
    }

    public renameCmdr(cmdrUuid: string, newName: string): void {
        const cmdrSaves = this.saves.get(cmdrUuid);
        if (cmdrSaves === undefined) {
            return;
        }

        cmdrSaves.manual.forEach((save) => (save.player.name = newName));
        cmdrSaves.auto.forEach((save) => (save.player.name = newName));

        this.save();
    }

    public deleteSaveForCmdr(cmdrUuid: string, save: Save): Promise<void> {
        const cmdrSaves = this.saves.get(cmdrUuid);
        if (cmdrSaves === undefined) {
            return Promise.resolve();
        }

        const manualIndex = cmdrSaves.manual.findIndex((s) => s === save);
        if (manualIndex !== -1) {
            cmdrSaves.manual.splice(manualIndex, 1);
            return Promise.resolve();
        }

        const autoIndex = cmdrSaves.auto.findIndex((s) => s === save);
        if (autoIndex !== -1) {
            cmdrSaves.auto.splice(autoIndex, 1);
        }

        this.save();

        return Promise.resolve();
    }

    public deleteCmdr(cmdrUuid: string): Promise<void> {
        this.saves.delete(cmdrUuid);
        this.save();

        return Promise.resolve();
    }

    public getCmdrUuids(): Promise<string[]> {
        return Promise.resolve([...this.saves.keys()]);
    }

    public async addManualSave(cmdrUuid: string, save: Save) {
        const cmdrSaves = (await this.getSavesForCmdr(cmdrUuid)) ?? { manual: [], auto: [] };
        cmdrSaves.manual.unshift(save);

        this.saves.set(cmdrUuid, cmdrSaves);

        return this.save();
    }

    public async addAutoSave(cmdrUuid: string, save: Save) {
        const cmdrSaves = (await this.getSavesForCmdr(cmdrUuid)) ?? { manual: [], auto: [] };
        cmdrSaves.auto.unshift(save);

        while (cmdrSaves.auto.length > Settings.MAX_AUTO_SAVES) {
            cmdrSaves.auto.pop(); // dequeue the oldest autosave
        }

        this.saves.set(cmdrUuid, cmdrSaves);

        return this.save();
    }
}
