//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Color3 } from "@babylonjs/core/Maths/math.color";
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import { SamplerEnumType, ShaderSamplers, ShaderUniforms, UniformEnumType } from "../../uberCore/postProcesses/types";
import { gcd } from "terrain-generation";
import { Scene } from "@babylonjs/core/scene";
import { Effect } from "@babylonjs/core/Materials/effect";
import flatCloudLUT from "../../../shaders/textures/flatCloudLUT.glsl";

export class CloudsUniforms {
    layerRadius: number;
    smoothness: number;
    specularPower: number;
    frequency: number;
    detailFrequency: number;
    coverage: number;
    sharpness: number;
    color: Color3;
    worleySpeed: number;
    detailSpeed: number;
    time: number;

    lut: ProceduralTexture | null = null;

    constructor(planetRadius: number, cloudLayerHeight: number, waterAmount: number, pressure: number) {
        this.layerRadius = planetRadius + cloudLayerHeight;
        this.specularPower = 2;
        this.smoothness = 0.7;
        this.frequency = 4;
        this.detailFrequency = 12;
        this.coverage = 0.75 * Math.exp(-waterAmount * pressure);
        this.sharpness = 2.5;
        this.color = new Color3(0.8, 0.8, 0.8);
        this.worleySpeed = 0.0005;
        this.detailSpeed = 0.003;
        this.time = 0;
    }

    getShaderUniforms(): ShaderUniforms {
        return [
            {
                name: "clouds_layerRadius",
                type: UniformEnumType.Float,
                get: () => {
                    return this.layerRadius;
                }
            },
            {
                name: "clouds_frequency",
                type: UniformEnumType.Float,
                get: () => {
                    return this.frequency;
                }
            },
            {
                name: "clouds_detailFrequency",
                type: UniformEnumType.Float,
                get: () => {
                    return this.detailFrequency;
                }
            },
            {
                name: "clouds_coverage",
                type: UniformEnumType.Float,
                get: () => {
                    return this.coverage;
                }
            },
            {
                name: "clouds_sharpness",
                type: UniformEnumType.Float,
                get: () => {
                    return this.sharpness;
                }
            },
            {
                name: "clouds_color",
                type: UniformEnumType.Color3,
                get: () => {
                    return this.color;
                }
            },
            {
                name: "clouds_worleySpeed",
                type: UniformEnumType.Float,
                get: () => {
                    return this.worleySpeed;
                }
            },
            {
                name: "clouds_detailSpeed",
                type: UniformEnumType.Float,
                get: () => {
                    return this.detailSpeed;
                }
            },
            {
                name: "clouds_smoothness",
                type: UniformEnumType.Float,
                get: () => {
                    return this.smoothness;
                }
            },
            {
                name: "clouds_specularPower",
                type: UniformEnumType.Float,
                get: () => {
                    return this.specularPower;
                }
            },
            {
                name: "time",
                type: UniformEnumType.Float,
                get: () => {
                    return -this.time % ((2 * Math.PI * gcd(this.worleySpeed * 10000, this.detailSpeed * 10000)) / this.worleySpeed);
                }
            }
        ];
    }

    /**
     * Returns the samplers for the shader when the LUT is ready
     * You cannot await this function as it would block the main thread and cause a deadlock as the LUT is created on the main thread
     * @param scene
     */
    public async getShaderSamplers(scene: Scene): Promise<ShaderSamplers> {
        return this.getLUT(scene).then((lut) => {
            return [
                {
                    name: "clouds_lut",
                    type: SamplerEnumType.Texture,
                    get: () => {
                        return lut;
                    }
                }
            ];
        });
    }

    /**
     * Returns the LUT for the rings when it is ready
     * You cannot await this function as it would block the main thread and cause a deadlock as the LUT is created on the main thread
     * @param scene
     * @private
     */
    private getLUT(scene: Scene): Promise<ProceduralTexture> {
        if (Effect.ShadersStore[`flatCloudsLUTFragmentShader`] === undefined) {
            Effect.ShadersStore[`flatCloudsLUTFragmentShader`] = flatCloudLUT;
        }

        if (this.lut === null) {
            const lut = new ProceduralTexture("flatCloudLUT", 4096, "flatCloudsLUT", scene, undefined, true, false);
            lut.setFloat("worleyFrequency", this.frequency);
            lut.setFloat("detailFrequency", this.detailFrequency);
            lut.refreshRate = 0;

            this.lut = lut;
        }

        return new Promise((resolve, reject) => {
            if (this.lut === null) throw new Error("LUT is null when creating promise");
            this.lut.executeWhenReady(() => {
                if (this.lut === null) throw new Error("LUT is null when executing when ready");
                resolve(this.lut);
            });
        });
    }
}
