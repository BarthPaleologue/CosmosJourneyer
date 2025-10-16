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

import { hashArray } from "@/utils/hash";
import { err, ok, type Result } from "@/utils/types";

import type { ICosmosJourneyerBackend } from ".";
import { EncyclopaediaGalacticaLocal } from "./encyclopaedia/encyclopaediaGalacticaLocal";
import { EncyclopaediaGalacticaManager } from "./encyclopaedia/encyclopaediaGalacticaManager";
import { OPFSFileSystem } from "./save/opfsFileSystem";
import type { ISaveBackend } from "./save/saveBackend";
import { SaveBackendMultiFile } from "./save/saveBackendMultiFile";
import { SaveBackendSingleFile } from "./save/saveBackendSingleFile";
import { SaveLocalStorage } from "./save/saveLocalStorage";
import { getLoneStarSystem } from "./universe/customSystems/loneStar";
import { registerCustomSystems } from "./universe/customSystems/registerCustomSystems";
import { generateDarkKnightModel } from "./universe/proceduralGenerators/anomalies/darkKnightModelGenerator";
import { UniverseBackend } from "./universe/universeBackend";

export class CosmosJourneyerBackendLocal implements ICosmosJourneyerBackend {
    readonly save: ISaveBackend;
    readonly encyclopaedia: EncyclopaediaGalacticaManager;
    readonly universe: UniverseBackend;

    constructor(save: ISaveBackend, encyclopaedia: EncyclopaediaGalacticaManager, universe: UniverseBackend) {
        this.save = save;
        this.encyclopaedia = encyclopaedia;
        this.universe = universe;
    }

    static async New(): Promise<Result<CosmosJourneyerBackendLocal, Error>> {
        const universeBackend = new UniverseBackend(getLoneStarSystem());
        registerCustomSystems(universeBackend);

        universeBackend.registerGeneralPlugin(
            (system) => {
                return (
                    hashArray([
                        system.coordinates.starSectorX,
                        system.coordinates.starSectorY,
                        system.coordinates.starSectorZ,
                        system.coordinates.localX,
                        system.coordinates.localY,
                        system.coordinates.localZ,
                    ]) > 0.5
                );
            },
            (system) => {
                const stellarIds = system.stellarObjects.map((stellarObject) => stellarObject.id);
                system.anomalies.push(generateDarkKnightModel(stellarIds));

                return system;
            },
        );

        const encyclopaedia = new EncyclopaediaGalacticaManager();
        encyclopaedia.backends.push(new EncyclopaediaGalacticaLocal(universeBackend));

        const legacySaveBackendResult = await SaveBackendSingleFile.CreateAsync(
            new SaveLocalStorage(SaveLocalStorage.SAVES_KEY),
            new SaveLocalStorage(SaveLocalStorage.BACKUP_SAVE_KEY),
            universeBackend,
        );

        let saveBackend: ISaveBackend | undefined = undefined;

        const opfsFileSystemResult = await OPFSFileSystem.CreateAsync();
        if (opfsFileSystemResult.success) {
            const opfsSaveBackend = await SaveBackendMultiFile.CreateAsync(opfsFileSystemResult.value, universeBackend);
            if (opfsSaveBackend.success) {
                if (legacySaveBackendResult.success) {
                    // migrate saves from the legacy save backend to the OPFS save backend
                    const saves = await legacySaveBackendResult.value.exportSaves();
                    await opfsSaveBackend.value.importSaves(saves);
                }
                saveBackend = opfsSaveBackend.value;
            } else if (legacySaveBackendResult.success) {
                // fallback to the legacy save backend if OPFS failed
                saveBackend = legacySaveBackendResult.value;
            }
        }

        if (saveBackend === undefined) {
            return err(
                new Error("Failed to initialize save backend: OPFS not supported and legacy save backend failed"),
            );
        }

        return ok(new CosmosJourneyerBackendLocal(saveBackend, encyclopaedia, universeBackend));
    }
}
