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
import { TextureSampler } from "@babylonjs/core/Materials/Textures/textureSampler";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { type Vector3 } from "@babylonjs/core/Maths/math.vector";

import { type HeightMap1x1 } from "@/frontend/assets/textures/heightMaps/utils";

import { type Direction } from "@/utils/direction";
import { retry } from "@/utils/retry";

import { Settings } from "@/settings";

import heightMapComputeSource from "@shaders/compute/terrain/sphericalHeightFieldTexture1x1.wgsl";

export class SphericalHeightFieldBuilder1x1 {
    private readonly computeShader: ComputeShader;

    private readonly paramsBuffer: UniformBuffer;

    private readonly terrainModelBuffer: UniformBuffer;

    private static WORKGROUP_SIZE = [16, 16] as const;

    private constructor(computeShader: ComputeShader, engine: WebGPUEngine) {
        this.computeShader = computeShader;

        this.paramsBuffer = new UniformBuffer(engine);

        this.paramsBuffer.addUniform("nbVerticesPerRow", 1);
        this.paramsBuffer.addUniform("size", 1);
        this.paramsBuffer.addUniform("direction", 1);
        this.paramsBuffer.addUniform("chunk_position_on_cube", 3);
        this.paramsBuffer.addUniform("sphere_radius", 1);
        this.paramsBuffer.addUniform("chunk_position_on_sphere", 3);
        this.paramsBuffer.update();

        this.computeShader.setUniformBuffer("params", this.paramsBuffer);

        this.terrainModelBuffer = new UniformBuffer(engine);
        this.terrainModelBuffer.addUniform("min_height", 1);
        this.terrainModelBuffer.addUniform("max_height", 1);

        this.computeShader.setUniformBuffer("terrainModel", this.terrainModelBuffer);

        const heightMapSampler = new TextureSampler();
        heightMapSampler.setParameters(); // use the default values
        heightMapSampler.samplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
        heightMapSampler.useMipMaps = false;
        this.computeShader.setTextureSampler("heightMapSampler", heightMapSampler);
    }

    static async New(engine: WebGPUEngine): Promise<SphericalHeightFieldBuilder1x1> {
        const computeShader = new ComputeShader(
            "sphericalHeightMapTextureComputeShader",
            engine,
            { computeSource: heightMapComputeSource },
            {
                bindingsMapping: {
                    positions: { group: 0, binding: 0 },
                    params: { group: 0, binding: 1 },
                    heightMap: { group: 0, binding: 2 },
                    heightMapSampler: { group: 0, binding: 3 },
                    terrainModel: { group: 0, binding: 4 },
                },
            },
        );

        await retry(() => computeShader.isReady(), Settings.COMPUTE_SHADER_READY_MAX_RETRY, 10);

        return new SphericalHeightFieldBuilder1x1(computeShader, engine);
    }

    dispatch(
        chunkPositionOnCube: Vector3,
        chunkPositionOnSphere: Vector3,
        nbVerticesPerRow: number,
        direction: Direction,
        sphereRadius: number,
        size: number,
        terrainModel: {
            heightMap: HeightMap1x1;
            minHeight: number;
            maxHeight: number;
        },
        engine: WebGPUEngine,
    ): StorageBuffer {
        this.paramsBuffer.updateUInt("nbVerticesPerRow", nbVerticesPerRow);
        this.paramsBuffer.updateVector3("chunk_position_on_cube", chunkPositionOnCube);
        this.paramsBuffer.updateVector3("chunk_position_on_sphere", chunkPositionOnSphere);
        this.paramsBuffer.updateFloat("sphere_radius", sphereRadius);
        this.paramsBuffer.updateUInt("direction", direction);
        this.paramsBuffer.updateFloat("size", size);
        this.paramsBuffer.update();

        this.terrainModelBuffer.updateFloat("min_height", terrainModel.minHeight);
        this.terrainModelBuffer.updateFloat("max_height", terrainModel.maxHeight);
        this.terrainModelBuffer.update();

        this.computeShader.setTexture("heightMap", terrainModel.heightMap.texture, false);

        const positionsBuffer = new StorageBuffer(
            engine,
            Float32Array.BYTES_PER_ELEMENT * nbVerticesPerRow * nbVerticesPerRow * 3,
            Constants.BUFFER_CREATIONFLAG_VERTEX | Constants.BUFFER_CREATIONFLAG_READWRITE,
        );
        this.computeShader.setStorageBuffer("positions", positionsBuffer);

        this.computeShader.dispatch(
            nbVerticesPerRow / SphericalHeightFieldBuilder1x1.WORKGROUP_SIZE[0],
            nbVerticesPerRow / SphericalHeightFieldBuilder1x1.WORKGROUP_SIZE[1],
            1,
        );

        return positionsBuffer;
    }
}
