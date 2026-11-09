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

/**
 * Owns the asset containers loaded for game modules.
 *
 * The assets are handed to content factories through their load context so modules
 * can retrieve their own resources without depending on the asset registry.
 */
export class ModuleAssets {
    private readonly containers: Map<string, AssetContainer>;

    /**
     * @param containers Asset containers keyed by namespaced identifier.
     */
    constructor(containers: Iterable<readonly [string, AssetContainer]>) {
        this.containers = new Map(containers);
    }

    /**
     * @param id Namespaced asset identifier.
     * @returns The loaded container, or `undefined` if no asset uses this identifier.
     */
    public getContainer(id: string): AssetContainer | undefined {
        return this.containers.get(id);
    }

    /**
     * Disposes every container owned by this asset set.
     */
    public dispose(): void {
        for (const container of this.containers.values()) {
            container.dispose();
        }
        this.containers.clear();
    }
}
