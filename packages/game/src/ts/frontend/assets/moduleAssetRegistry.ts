//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import type { AssetContainer } from "@babylonjs/core/assetContainer";
import type { Scene } from "@babylonjs/core/scene";
import { err, ok } from "@cosmos-journeyer/typescript";
import type { Result } from "@cosmos-journeyer/typescript";

import type { ILoadingProgressMonitor } from "./loadingProgressMonitor";
import { ModuleAssets } from "./moduleAssets";

/**
 * Collects the asset containers declared by game modules until they can be loaded.
 *
 * Modules register loaders during setup. The bootstrap then calls `load` once with
 * the scene that will own the containers and passes the returned asset set to the
 * content factories through their load context.
 */
export class ModuleAssetRegistry {
    private readonly loaders: Map<string, (scene: Scene) => Promise<AssetContainer>> = new Map();

    /**
     * @param id Namespaced asset identifier shared between modules.
     * @param loader Creates the asset container from the scene that will own it.
     */
    public registerContainer(id: string, loader: (scene: Scene) => Promise<AssetContainer>): void {
        if (this.loaders.has(id)) {
            throw new Error(`Asset "${id}" is already registered`);
        }

        this.loaders.set(id, loader);
    }

    /**
     * Runs every registered loader concurrently.
     * @param scene Scene that owns the loaded asset containers.
     * @param progressMonitor Tracks the per-container loading tasks.
     * @returns The loaded asset containers, or the first loading error after disposing
     * the containers created by this call.
     */
    public async load(scene: Scene, progressMonitor: ILoadingProgressMonitor): Promise<Result<ModuleAssets, Error>> {
        const containers = new Map<string, AssetContainer>();

        const outcomes = await Promise.all(
            [...this.loaders].map(async ([id, loader]) => {
                progressMonitor.startTask();
                try {
                    containers.set(id, await loader(scene));
                    return null;
                } catch (error) {
                    return new Error(`Could not load asset "${id}"`, { cause: error });
                } finally {
                    progressMonitor.completeTask();
                }
            }),
        );

        const moduleAssets = new ModuleAssets(containers);
        const failure = outcomes.find((outcome) => outcome !== null);
        if (failure !== undefined) {
            moduleAssets.dispose();
            return err(failure);
        }

        return ok(moduleAssets);
    }
}
