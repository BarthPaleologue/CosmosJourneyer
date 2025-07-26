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

import { Settings } from "@/settings";

import heightMapComputeSource from "@shaders/compute/terrain/planarProceduralHeightField.wgsl";

export class PlanarProceduralHeightField {
    private readonly computeShader: ComputeShader;

    private readonly paramsBuffer: UniformBuffer;

    private static WORKGROUP_SIZE = [16, 16] as const;

    private constructor(computeShader: ComputeShader, engine: WebGPUEngine) {
        const numOctaves = 2;
        const lacunarity = 2.0;
        const persistence = 0.5;
        const initialScale = 0.5;

        this.computeShader = computeShader;

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

    static async New(engine: WebGPUEngine): Promise<PlanarProceduralHeightField> {
        const computeShader = new ComputeShader(
            "heightMap",
            engine,
            { computeSource: heightMapComputeSource },
            {
                bindingsMapping: {
                    positions: { group: 0, binding: 0 },
                    params: { group: 0, binding: 1 },
                },
            },
        );

        await retry(() => computeShader.isReady(), Settings.COMPUTE_SHADER_READY_MAX_RETRY, 10);

        return new PlanarProceduralHeightField(computeShader, engine);
    }

    dispatch(nbVerticesPerRow: number, size: number, engine: WebGPUEngine): StorageBuffer {
        this.paramsBuffer.updateUInt("nbVerticesPerRow", nbVerticesPerRow);
        this.paramsBuffer.updateFloat("size", size);
        this.paramsBuffer.update();

        const positionsBuffer = new StorageBuffer(
            engine,
            Float32Array.BYTES_PER_ELEMENT * nbVerticesPerRow * nbVerticesPerRow * 3,
            Constants.BUFFER_CREATIONFLAG_VERTEX | Constants.BUFFER_CREATIONFLAG_READWRITE,
        );
        this.computeShader.setStorageBuffer("positions", positionsBuffer);

        this.computeShader.dispatch(
            nbVerticesPerRow / PlanarProceduralHeightField.WORKGROUP_SIZE[0],
            nbVerticesPerRow / PlanarProceduralHeightField.WORKGROUP_SIZE[1],
            1,
        );

        return positionsBuffer;
    }
}
