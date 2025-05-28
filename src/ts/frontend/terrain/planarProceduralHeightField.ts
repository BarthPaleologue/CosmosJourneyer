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

    private readonly paramsBuffer: UniformBuffer;

    constructor(engine: WebGPUEngine) {
        const numOctaves = 2;
        const lacunarity = 2.0;
        const persistence = 0.5;
        const initialScale = 0.5;

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

        this.paramsBuffer = new UniformBuffer(engine);

        this.paramsBuffer.addUniform("nbVerticesPerRow", 1);
        this.paramsBuffer.addUniform("size", 1);
        this.paramsBuffer.addUniform("octaves", 1);
        this.paramsBuffer.addUniform("lacunarity", 1);
        this.paramsBuffer.addUniform("persistence", 1);
        this.paramsBuffer.addUniform("scaleFactor", 1);

        this.paramsBuffer.updateInt("octaves", numOctaves);
        this.paramsBuffer.updateFloat("lacunarity", lacunarity);
        this.paramsBuffer.updateFloat("persistence", persistence);
        this.paramsBuffer.updateFloat("scaleFactor", initialScale);
        this.paramsBuffer.update();

        this.computeShader.setUniformBuffer("params", this.paramsBuffer);
    }

    dispatch(
        nbVerticesPerRow: number,
        size: number,
        engine: WebGPUEngine,
    ): Promise<{
        positions: Float32Array;
        indices: Uint32Array;
    }> {
        this.paramsBuffer.updateUInt("nbVerticesPerRow", nbVerticesPerRow);
        this.paramsBuffer.updateFloat("size", size);
        this.paramsBuffer.update();

        const positions = new Float32Array(nbVerticesPerRow * nbVerticesPerRow * 3);
        const indices = new Uint32Array((nbVerticesPerRow - 1) * (nbVerticesPerRow - 1) * 6);

        const positionsBuffer = new StorageBuffer(engine, positions.byteLength);
        positionsBuffer.update(positions);
        this.computeShader.setStorageBuffer("positions", positionsBuffer);

        const indicesBuffer = new StorageBuffer(engine, indices.byteLength);
        indicesBuffer.update(indices);
        this.computeShader.setStorageBuffer("indices", indicesBuffer);

        return new Promise((resolve) => {
            this.computeShader
                .dispatchWhenReady(nbVerticesPerRow, nbVerticesPerRow, 1)
                .then(async () => {
                    try {
                        const [positionsBufferView, indicesBufferView] = await Promise.all([
                            positionsBuffer.read(),
                            indicesBuffer.read(),
                        ]);

                        const positions = new Float32Array(positionsBufferView.buffer);
                        positionsBuffer.dispose();

                        const indices = new Uint32Array(indicesBufferView.buffer);
                        indicesBuffer.dispose();

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
