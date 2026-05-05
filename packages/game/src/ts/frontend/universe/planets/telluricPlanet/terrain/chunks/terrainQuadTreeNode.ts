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

import { type TerrainChunkMesh } from "./terrainChunkMesh";

export type TerrainQuadTreeChildren = [
    TerrainQuadTreeNode,
    TerrainQuadTreeNode,
    TerrainQuadTreeNode,
    TerrainQuadTreeNode,
];

/**
 * Represents a node in the terrain chunk quad-tree.
 * Contains a chunk and optionally its 4 children nodes, which represent the 4 sub-quadrants of the chunk.
 */
export class TerrainQuadTreeNode {
    public readonly chunk: TerrainChunkMesh;

    private children: TerrainQuadTreeChildren | null = null;

    constructor(chunk: TerrainChunkMesh) {
        this.chunk = chunk;
    }

    public getChildren(): TerrainQuadTreeChildren | null {
        return this.children;
    }

    public setChildren(children: TerrainQuadTreeChildren): void {
        this.children = children;
    }

    public disposeChildren(): void {
        if (this.children === null) {
            return;
        }

        for (const child of this.children) {
            child.dispose();
        }
        this.children = null;
    }

    /**
     * @returns An iterator of all chunks in the subtree of this node, including its own chunk
     */
    public *getChunks(): Generator<TerrainChunkMesh, void, unknown> {
        yield this.chunk;

        if (this.children === null) {
            return;
        }

        for (const child of this.children) {
            yield* child.getChunks();
        }
    }

    public isIdle(): boolean {
        if (!this.chunk.isLoaded()) {
            return false;
        } else if (this.children === null) {
            return true;
        }

        return this.children.every((child) => child.isIdle());
    }

    public canBeSubdivided(): boolean {
        return this.chunk.canBeSubdivided();
    }

    public updateVisibility(): void {
        if (this.children === null || this.children.some((child) => !child.chunk.isLoaded())) {
            this.showOwnChunk();
            this.hideChildren();
            return;
        }

        this.hideOwnChunk();
        for (const child of this.children) {
            child.updateVisibility();
        }
    }

    private hideChildren(): void {
        if (this.children === null) {
            return;
        }

        for (const child of this.children) {
            child.hideSubtree();
        }
    }

    private hideSubtree(): void {
        this.hideOwnChunk();

        if (this.children === null) {
            return;
        }

        for (const child of this.children) {
            child.hideSubtree();
        }
    }

    private showOwnChunk(): void {
        this.chunk.setActiveForLOD(true);
    }

    private hideOwnChunk(): void {
        this.chunk.setActiveForLOD(false);
    }

    public dispose(): void {
        this.disposeChildren();
        this.chunk.dispose();
    }
}
