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
import { type Vector3 } from "@babylonjs/core/Maths/math.vector";

import type { ProceduralTerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import { type Direction } from "@/utils/direction";
import { retry } from "@/utils/retry";

import { Settings } from "@/settings";

import heightMapComputeSource from "@shaders/compute/terrain/sphericalProceduralHeightField.wgsl";

export class SphericalProceduralHeightFieldBuilder {
    private readonly computeShader: ComputeShader;

    private readonly paramsBuffer: UniformBuffer;

    private readonly terrainModel: UniformBuffer;

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

        this.terrainModel = new UniformBuffer(engine);
        this.terrainModel.addUniform("seed", 1);
        this.terrainModel.addUniform("continental_crust_elevation", 1);
        this.terrainModel.addUniform("continental_crust_fraction", 1);
        this.terrainModel.addUniform("mountain_elevation", 1);
        this.terrainModel.addUniform("mountain_terrace_elevation", 1);
        this.terrainModel.addUniform("craters_octave_count", 1);
        this.terrainModel.addUniform("craters_sparsity", 1);
        this.terrainModel.update();

        this.computeShader.setUniformBuffer("terrain_model", this.terrainModel);
    }

    static async New(engine: WebGPUEngine): Promise<SphericalProceduralHeightFieldBuilder> {
        const computeShader = new ComputeShader(
            "heightMap",
            engine,
            { computeSource: heightMapComputeSource },
            {
                bindingsMapping: {
                    positions: { group: 0, binding: 0 },
                    params: { group: 0, binding: 1 },
                    terrain_model: { group: 0, binding: 2 },
                },
            },
        );

        await retry(() => computeShader.isReady(), Settings.COMPUTE_SHADER_READY_MAX_RETRY, 10);

        return new SphericalProceduralHeightFieldBuilder(computeShader, engine);
    }

    dispatch(
        chunkPositionOnCube: Vector3,
        chunkPositionOnSphere: Vector3,
        nbVerticesPerRow: number,
        direction: Direction,
        sphereRadius: number,
        size: number,
        terrainModel: ProceduralTerrainModel,
        engine: WebGPUEngine,
    ): StorageBuffer {
        this.paramsBuffer.updateUInt("nbVerticesPerRow", nbVerticesPerRow);
        this.paramsBuffer.updateVector3("chunk_position_on_cube", chunkPositionOnCube);
        this.paramsBuffer.updateVector3("chunk_position_on_sphere", chunkPositionOnSphere);
        this.paramsBuffer.updateFloat("sphere_radius", sphereRadius);
        this.paramsBuffer.updateUInt("direction", direction);
        this.paramsBuffer.updateFloat("size", size);
        this.paramsBuffer.update();

        this.terrainModel.updateFloat("seed", terrainModel.seed);
        this.terrainModel.updateFloat("continental_crust_elevation", terrainModel.continentalCrust.elevation);
        this.terrainModel.updateFloat("continental_crust_fraction", terrainModel.continentalCrust.fraction);
        this.terrainModel.updateFloat("mountain_elevation", terrainModel.mountain.elevation);
        this.terrainModel.updateFloat("mountain_terrace_elevation", terrainModel.mountain.terraceElevation);
        this.terrainModel.updateUInt("craters_octave_count", terrainModel.craters.octaveCount);
        this.terrainModel.updateFloat("craters_sparsity", terrainModel.craters.sparsity); // Default value, can be adjusted later
        this.terrainModel.update();

        const positionsBuffer = new StorageBuffer(
            engine,
            Float32Array.BYTES_PER_ELEMENT * nbVerticesPerRow * nbVerticesPerRow * 3,
            Constants.BUFFER_CREATIONFLAG_VERTEX | Constants.BUFFER_CREATIONFLAG_READWRITE,
        );
        this.computeShader.setStorageBuffer("positions", positionsBuffer);

        this.computeShader.dispatch(
            nbVerticesPerRow / SphericalProceduralHeightFieldBuilder.WORKGROUP_SIZE[0],
            nbVerticesPerRow / SphericalProceduralHeightFieldBuilder.WORKGROUP_SIZE[1],
            1,
        );

        return positionsBuffer;
    }
}
