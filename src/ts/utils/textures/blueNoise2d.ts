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

import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import type { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import type { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";

import { Settings } from "@/settings";

import { retry } from "../retry";

import shaderCode from "@shaders/compute/textures/blueNoise2d.wgsl";

export class BlueNoise2dTextureGenerator {
    private readonly computeShader: ComputeShader;

    private static readonly WORKGROUP_SIZE = [8, 8] as const;

    static async New(engine: WebGPUEngine) {
        const computeShader = new ComputeShader(
            "BlueNoise2dTextureGenerator",
            engine,
            { computeSource: shaderCode },
            {
                bindingsMapping: {
                    output_texture: { group: 0, binding: 0 },
                },
            },
        );

        await retry(() => computeShader.isReady(), Settings.COMPUTE_SHADER_READY_MAX_RETRY, 10);

        return new BlueNoise2dTextureGenerator(computeShader);
    }

    constructor(computeShader: ComputeShader) {
        this.computeShader = computeShader;
    }

    dispatch(storageTexture: RawTexture) {
        this.computeShader.setStorageTexture("output_texture", storageTexture);

        this.computeShader.dispatch(
            storageTexture.getSize().width / BlueNoise2dTextureGenerator.WORKGROUP_SIZE[0],
            storageTexture.getSize().height / BlueNoise2dTextureGenerator.WORKGROUP_SIZE[1],
        );
    }
}
