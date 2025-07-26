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
import { Constants } from "@babylonjs/core/Engines/constants";
import { type WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";

import { retry } from "@/utils/retry";

import gridIndicesComputeSource from "@shaders/compute/terrain/gridIndices.wgsl";

export class SquareGridIndicesComputer {
    private readonly computeShader: ComputeShader;

    private readonly paramsBuffer: UniformBuffer;

    private static WORKGROUP_SIZE = [16, 16] as const;

    private constructor(computeShader: ComputeShader, engine: WebGPUEngine) {
        this.computeShader = computeShader;

        this.paramsBuffer = new UniformBuffer(engine);

        this.paramsBuffer.addUniform("row_vertex_count", 1);
        this.computeShader.setUniformBuffer("params", this.paramsBuffer);
    }

    static async New(engine: WebGPUEngine): Promise<SquareGridIndicesComputer> {
        const computeShader = new ComputeShader(
            "gridIndicesComputeShader",
            engine,
            { computeSource: gridIndicesComputeSource },
            {
                bindingsMapping: {
                    indices: { group: 0, binding: 0 },
                    params: { group: 0, binding: 1 },
                },
            },
        );

        await retry(() => computeShader.isReady(), 1000, 10);

        return new SquareGridIndicesComputer(computeShader, engine);
    }

    dispatch(nbVerticesPerRow: number, engine: WebGPUEngine): StorageBuffer {
        this.paramsBuffer.updateUInt("row_vertex_count", nbVerticesPerRow);
        this.paramsBuffer.update();

        const indicesBuffer = new StorageBuffer(
            engine,
            Uint32Array.BYTES_PER_ELEMENT * (nbVerticesPerRow - 1) * (nbVerticesPerRow - 1) * 6,
            Constants.BUFFER_CREATIONFLAG_INDEX | Constants.BUFFER_CREATIONFLAG_READWRITE,
        );
        this.computeShader.setStorageBuffer("indices", indicesBuffer);

        this.computeShader.dispatch(
            nbVerticesPerRow / SquareGridIndicesComputer.WORKGROUP_SIZE[0],
            nbVerticesPerRow / SquareGridIndicesComputer.WORKGROUP_SIZE[1],
            1,
        );

        return indicesBuffer;
    }
}
