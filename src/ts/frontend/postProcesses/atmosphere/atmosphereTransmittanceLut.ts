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
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";

import { retry } from "@/utils/retry";

import { Settings } from "@/settings";

import shaderCode from "@shaders/compute/atmosphere/transmittanceLut.wgsl";

export class TransmittanceLutGenerator {
    private readonly computeShader: ComputeShader;

    private static readonly WORKGROUP_SIZE = [8, 8] as const;

    private readonly atmosphereBuffer: UniformBuffer;

    static async New(engine: WebGPUEngine) {
        const computeShader = new ComputeShader(
            "TransmittanceLutGenerator",
            engine,
            { computeSource: shaderCode },
            {
                bindingsMapping: {
                    output_texture: { group: 0, binding: 0 },
                    atmosphere: { group: 0, binding: 1 },
                },
            },
        );

        await retry(() => computeShader.isReady(), Settings.COMPUTE_SHADER_READY_MAX_RETRY, 10);

        return new TransmittanceLutGenerator(computeShader, engine);
    }

    constructor(computeShader: ComputeShader, engine: WebGPUEngine) {
        this.computeShader = computeShader;

        this.atmosphereBuffer = new UniformBuffer(engine);

        this.atmosphereBuffer.addUniform("min_radius", 1);
        this.atmosphereBuffer.addUniform("max_radius", 1);
        this.atmosphereBuffer.addUniform("rayleigh_coefficients", 3);
        this.atmosphereBuffer.addUniform("rayleigh_scale_height", 1);
        this.atmosphereBuffer.addUniform("mie_coefficients", 3);
        this.atmosphereBuffer.addUniform("mie_scale_height", 1);
        this.atmosphereBuffer.addUniform("ozone_coefficients", 3);
        this.atmosphereBuffer.addUniform("ozone_height", 1);
        this.atmosphereBuffer.addUniform("ozone_falloff", 1);
        this.atmosphereBuffer.update();

        this.computeShader.setUniformBuffer("atmosphere", this.atmosphereBuffer);
    }

    dispatch(
        storageTexture: RawTexture,
        atmosphere: {
            radius: {
                min: number;
                max: number;
            };
            rayleighScattering: {
                coefficients: [number, number, number];
                scaleHeight: number;
            };
            mieScattering: {
                coefficients: [number, number, number];
                scaleHeight: number;
            };
            ozoneAbsorption: {
                coefficients: [number, number, number];
                height: number;
                falloff: number;
            };
        },
    ) {
        this.computeShader.setStorageTexture("output_texture", storageTexture);

        this.atmosphereBuffer.updateFloat("min_radius", atmosphere.radius.min);
        this.atmosphereBuffer.updateFloat("max_radius", atmosphere.radius.max);
        this.atmosphereBuffer.updateFloat3("rayleigh_coefficients", ...atmosphere.rayleighScattering.coefficients);
        this.atmosphereBuffer.updateFloat("rayleigh_scale_height", atmosphere.rayleighScattering.scaleHeight);
        this.atmosphereBuffer.updateFloat3("mie_coefficients", ...atmosphere.mieScattering.coefficients);
        this.atmosphereBuffer.updateFloat("mie_scale_height", atmosphere.mieScattering.scaleHeight);
        this.atmosphereBuffer.updateFloat3("ozone_coefficients", ...atmosphere.ozoneAbsorption.coefficients);
        this.atmosphereBuffer.updateFloat("ozone_height", atmosphere.ozoneAbsorption.height);
        this.atmosphereBuffer.updateFloat("ozone_falloff", atmosphere.ozoneAbsorption.falloff);
        this.atmosphereBuffer.update();

        this.computeShader.dispatch(
            storageTexture.getSize().width / TransmittanceLutGenerator.WORKGROUP_SIZE[0],
            storageTexture.getSize().height / TransmittanceLutGenerator.WORKGROUP_SIZE[1],
        );
    }
}
