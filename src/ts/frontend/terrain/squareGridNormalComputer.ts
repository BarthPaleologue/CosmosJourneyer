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

import computeSource from "@shaders/compute/utils/squareGridComputeNormals.wgsl";

export class SquareGridNormalComputer {
    private readonly computeShader: ComputeShader;

    private readonly paramsBuffer: UniformBuffer;

    private static WORKGROUP_SIZE = [16, 16] as const;

    protected constructor(computeShader: ComputeShader, engine: WebGPUEngine) {
        this.computeShader = computeShader;

        this.paramsBuffer = new UniformBuffer(engine);
        this.paramsBuffer.addUniform("row_vertex_count", 1);
        this.computeShader.setUniformBuffer("params", this.paramsBuffer);
    }

    public static async New(engine: WebGPUEngine): Promise<SquareGridNormalComputer> {
        const computeShader = new ComputeShader(
            "squareGridNormalComputer",
            engine,
            { computeSource },
            {
                bindingsMapping: {
                    positions: { group: 0, binding: 0 },
                    normals: { group: 0, binding: 1 },
                    params: { group: 0, binding: 2 },
                },
            },
        );

        await retry(() => computeShader.isReady(), 1000, 10);

        return new SquareGridNormalComputer(computeShader, engine);
    }

    dispatch(nbVerticesPerRow: number, positions: StorageBuffer, engine: WebGPUEngine): StorageBuffer {
        const positionsBuffer = positions;
        this.computeShader.setStorageBuffer("positions", positionsBuffer);

        const normalBuffer = new StorageBuffer(
            engine,
            Float32Array.BYTES_PER_ELEMENT * nbVerticesPerRow * nbVerticesPerRow * 3,
            Constants.BUFFER_CREATIONFLAG_VERTEX | Constants.BUFFER_CREATIONFLAG_READWRITE,
        );
        this.computeShader.setStorageBuffer("normals", normalBuffer);

        this.paramsBuffer.updateUInt("row_vertex_count", nbVerticesPerRow);
        this.paramsBuffer.update();

        this.computeShader.dispatch(
            nbVerticesPerRow / SquareGridNormalComputer.WORKGROUP_SIZE[0],
            nbVerticesPerRow / SquareGridNormalComputer.WORKGROUP_SIZE[1],
            1,
        );

        return normalBuffer;
    }
}
