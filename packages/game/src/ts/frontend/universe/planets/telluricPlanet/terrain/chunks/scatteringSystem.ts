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

import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { z } from "zod";

import type { Objects } from "@/frontend/assets/objects";

import { assertUnreachable } from "@/utils/types";

import { createInstancePatch } from "../../../../../helpers/instancing";

export const AssetTypeSchema = z.enum(["grass", "rock", "tree", "butterfly"]);

export type AssetType = z.infer<typeof AssetTypeSchema>;

export const ScatteredInstancesSchema = z.partialRecord(AssetTypeSchema, z.instanceof(Float32Array));

export type ScatteredInstances = z.infer<typeof ScatteredInstancesSchema>;

export class ScatteringSystem {
    private readonly assets: Objects;

    private readonly chunkToScatteredAssets = new Map<string, Partial<Record<AssetType, Mesh>>>();

    public constructor(assets: Objects) {
        this.assets = assets;
    }

    public scatterInChunk(chunkTransform: TransformNode, scattering: ScatteredInstances): void {
        this.clearChunk(chunkTransform.name);

        const chunkPatches: Partial<Record<AssetType, Mesh>> = {};
        for (const [assetType, matrixBuffer] of Object.entries(scattering) as Iterable<[AssetType, Float32Array]>) {
            let mesh: Mesh;
            switch (assetType) {
                case "grass":
                    mesh = this.assets.grassBlades[0];
                    break;
                case "rock":
                    mesh = this.assets.rock;
                    break;
                case "tree":
                    mesh = this.assets.tree;
                    break;
                case "butterfly":
                    mesh = this.assets.butterfly;
                    break;
                default:
                    assertUnreachable(assetType);
            }

            mesh = createInstancePatch(mesh, matrixBuffer);

            const chunkAbsolutePosition = chunkTransform.getAbsolutePosition();
            const chunkRotationQuaternion = chunkTransform.absoluteRotationQuaternion;

            mesh.position.copyFrom(chunkAbsolutePosition);
            mesh.rotationQuaternion = chunkRotationQuaternion;
            mesh.computeWorldMatrix(true);

            chunkPatches[assetType] = mesh;
        }

        this.chunkToScatteredAssets.set(chunkTransform.name, chunkPatches);
    }

    public clearChunk(chunkId: string): void {
        const chunkPatches = this.chunkToScatteredAssets.get(chunkId);
        if (chunkPatches === undefined) {
            return;
        }

        for (const patch of Object.values(chunkPatches)) {
            patch.dispose();
        }

        this.chunkToScatteredAssets.delete(chunkId);
    }

    public dispose() {
        for (const patches of this.chunkToScatteredAssets.values()) {
            for (const patch of Object.values(patches)) {
                patch.dispose();
            }
        }
        this.chunkToScatteredAssets.clear();
    }
}
