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

import { type HeightMap2x4 } from "@/frontend/assets/textures/heightmaps/types";

import { type Direction } from "@/utils/direction";
import { retry } from "@/utils/retry";

import heightMapComputeSource from "@shaders/compute/terrain/sphericalHeightFieldTexture2x4.wgsl";

export class SphericalHeightFieldBuilder2x4 {
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
        heightMapSampler.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        heightMapSampler.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this.computeShader.setTextureSampler("heightMapSampler", heightMapSampler);
    }

    static async New(engine: WebGPUEngine): Promise<SphericalHeightFieldBuilder2x4> {
        const computeShader = new ComputeShader(
            "sphericalHeightMap2x4ComputeShader",
            engine,
            { computeSource: heightMapComputeSource },
            {
                bindingsMapping: {
                    positions: { group: 0, binding: 0 },
                    params: { group: 0, binding: 1 },
                    heightMapSampler: { group: 0, binding: 2 },
                    terrainModel: { group: 0, binding: 3 },
                    heightMap_0_0: { group: 1, binding: 0 },
                    heightMap_0_1: { group: 1, binding: 1 },
                    heightMap_0_2: { group: 1, binding: 2 },
                    heightMap_0_3: { group: 1, binding: 3 },
                    heightMap_1_0: { group: 1, binding: 4 },
                    heightMap_1_1: { group: 1, binding: 5 },
                    heightMap_1_2: { group: 1, binding: 6 },
                    heightMap_1_3: { group: 1, binding: 7 },
                },
            },
        );

        await retry(() => computeShader.isReady(), 1000, 10);

        return new SphericalHeightFieldBuilder2x4(computeShader, engine);
    }

    dispatch(
        chunkPositionOnCube: Vector3,
        chunkPositionOnSphere: Vector3,
        nbVerticesPerRow: number,
        direction: Direction,
        sphereRadius: number,
        size: number,
        terrainModel: {
            heightMap: HeightMap2x4;
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

        this.computeShader.setTexture("heightMap_0_0", terrainModel.heightMap.textures[0][0], false);
        this.computeShader.setTexture("heightMap_0_1", terrainModel.heightMap.textures[0][1], false);
        this.computeShader.setTexture("heightMap_0_2", terrainModel.heightMap.textures[0][2], false);
        this.computeShader.setTexture("heightMap_0_3", terrainModel.heightMap.textures[0][3], false);
        this.computeShader.setTexture("heightMap_1_0", terrainModel.heightMap.textures[1][0], false);
        this.computeShader.setTexture("heightMap_1_1", terrainModel.heightMap.textures[1][1], false);
        this.computeShader.setTexture("heightMap_1_2", terrainModel.heightMap.textures[1][2], false);
        this.computeShader.setTexture("heightMap_1_3", terrainModel.heightMap.textures[1][3], false);

        const positionsBuffer = new StorageBuffer(
            engine,
            Float32Array.BYTES_PER_ELEMENT * nbVerticesPerRow * nbVerticesPerRow * 3,
            Constants.BUFFER_CREATIONFLAG_VERTEX | Constants.BUFFER_CREATIONFLAG_READWRITE,
        );
        this.computeShader.setStorageBuffer("positions", positionsBuffer);

        this.computeShader.dispatch(
            nbVerticesPerRow / SphericalHeightFieldBuilder2x4.WORKGROUP_SIZE[0],
            nbVerticesPerRow / SphericalHeightFieldBuilder2x4.WORKGROUP_SIZE[1],
            1,
        );

        return positionsBuffer;
    }
}
