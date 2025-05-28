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

import { StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import { type WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";

import heightMapComputeSource from "@shaders/compute/terrain/planarProceduralHeightField.wgsl";

export class PlanarProceduralHeightField {
    private readonly computeShader: ComputeShader;

    readonly nbVerticesPerRow: number;

    readonly positionsBuffer: StorageBuffer;
    readonly indicesBuffer: StorageBuffer;

    constructor(nbVerticesPerRow: number, size: number, engine: WebGPUEngine) {
        const numOctaves = 2;
        const lacunarity = 2.0;
        const persistence = 0.5;
        const initialScale = 0.5;

        this.nbVerticesPerRow = nbVerticesPerRow;

        this.computeShader = new ComputeShader(
            "heightMap",
            engine,
            { computeSource: heightMapComputeSource },
            {
                bindingsMapping: {
                    positions: { group: 0, binding: 0 },
                    indices: { group: 0, binding: 1 },
                    params: { group: 0, binding: 2 },
                },
            },
        );

        const positions = new Float32Array(nbVerticesPerRow * nbVerticesPerRow * 3);
        const indices = new Uint32Array((nbVerticesPerRow - 1) * (nbVerticesPerRow - 1) * 6);

        this.positionsBuffer = new StorageBuffer(engine, positions.byteLength);
        this.positionsBuffer.update(positions);
        this.computeShader.setStorageBuffer("positions", this.positionsBuffer);

        this.indicesBuffer = new StorageBuffer(engine, indices.byteLength);
        this.indicesBuffer.update(indices);
        this.computeShader.setStorageBuffer("indices", this.indicesBuffer);

        const paramsBuffer = new UniformBuffer(engine);

        paramsBuffer.addUniform("nbVerticesPerRow", 1);
        paramsBuffer.addUniform("size", 1);
        paramsBuffer.addUniform("octaves", 1);
        paramsBuffer.addUniform("lacunarity", 1);
        paramsBuffer.addUniform("persistence", 1);
        paramsBuffer.addUniform("scaleFactor", 1);

        paramsBuffer.updateUInt("nbVerticesPerRow", nbVerticesPerRow);
        paramsBuffer.updateFloat("size", size);
        paramsBuffer.updateInt("octaves", numOctaves);
        paramsBuffer.updateFloat("lacunarity", lacunarity);
        paramsBuffer.updateFloat("persistence", persistence);
        paramsBuffer.updateFloat("scaleFactor", initialScale);
        paramsBuffer.update();

        this.computeShader.setUniformBuffer("params", paramsBuffer);
    }

    dispatch(): Promise<{
        positions: Float32Array;
        indices: Uint32Array;
    }> {
        return new Promise((resolve) => {
            this.computeShader
                .dispatchWhenReady(this.nbVerticesPerRow, this.nbVerticesPerRow, 1)
                .then(async () => {
                    try {
                        const [positionsBufferView, indicesBufferView] = await Promise.all([
                            this.positionsBuffer.read(),
                            this.indicesBuffer.read(),
                        ]);

                        const positions = new Float32Array(positionsBufferView.buffer);
                        this.positionsBuffer.dispose();

                        const indices = new Uint32Array(indicesBufferView.buffer);
                        this.indicesBuffer.dispose();

                        resolve({
                            positions: positions,
                            indices: indices,
                        });
                    } catch (error) {
                        console.error("Error reading buffers:", error);
                    }
                })
                .catch((error: unknown) => {
                    console.error("Error dispatching compute shader:", error);
                });
        });
    }
}
