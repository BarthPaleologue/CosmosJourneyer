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

import { type PlanetChunk } from "./planetChunk";

/**
 * The DeleteSemaphore is responsible to delete chunk only when replacements are created to avoid holes in the surface of planets
 * Each time a replacement chunk is set ready, we decrement the countdown. When it reaches 0 the old chunks can be deleted
 */
export class DeleteSemaphore {
    readonly chunksToDelete: PlanetChunk[];
    readonly newChunks: PlanetChunk[];

    private resolved = false;

    constructor(newChunks: PlanetChunk[], chunksToDelete: PlanetChunk[]) {
        this.newChunks = newChunks;
        this.chunksToDelete = chunksToDelete;
    }

    private resolve() {
        for (const chunk of this.chunksToDelete) {
            chunk.dispose();
        }

        this.chunksToDelete.length = 0;
        this.newChunks.length = 0;

        this.resolved = true;
    }

    /**
     * Updates the state of the semaphore
     */
    public update() {
        if (this.isReadyToResolve()) {
            this.resolve();
        }
    }

    private isReadyToResolve() {
        let flag = this.newChunks.length;
        this.newChunks.forEach((chunk) => {
            // A disposed replacement has been superseded by another LOD transition. It should no longer block this
            // semaphore, but it must not release the fallback before its still-pending siblings are ready.
            if (chunk.isLoaded() || chunk.hasBeenDisposed()) {
                flag--;
            }
        });

        return flag === 0;
    }

    public isResolved() {
        return this.resolved;
    }

    public dispose() {
        this.chunksToDelete.forEach((chunk) => {
            chunk.dispose();
        });
        this.newChunks.forEach((chunk) => {
            chunk.dispose();
        });

        this.chunksToDelete.length = 0;
        this.newChunks.length = 0;
    }
}
