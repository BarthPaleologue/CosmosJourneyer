//  This file is part of Cosmos Journeyer
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
import { normalRandom, randRange } from "extended-random";
import { clamp } from "terrain-generation";
import { SamplerEnumType, ShaderSamplers, ShaderUniforms, UniformEnumType } from "../../uberCore/postProcesses/types";
import { Scene } from "@babylonjs/core/scene";
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import { Effect } from "@babylonjs/core/Materials/effect";
import ringsLUT from "../../../shaders/textures/ringsLUT.glsl";

export class RingsUniforms {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
    ringColor: Color3;

    private ringLut: ProceduralTexture | null = null;
    offset: number;

    constructor(rng: (step: number) => number) {
        this.ringStart = randRange(1.8, 2.2, rng, 1400);
        this.ringEnd = randRange(2.1, 4.0, rng, 1410);
        this.ringFrequency = 30.0;
        this.ringOpacity = clamp(normalRandom(0.7, 0.1, rng, 1420), 0, 1);
        this.ringColor = new Color3(214, 168, 122).scaleInPlace(randRange(1.0, 1.5, rng, 1430) / 255);

        this.offset = randRange(-100, 100, rng, 1440);
    }

    static GetEmptyShaderUniforms(): ShaderUniforms {
        return [
            {
                name: "rings_start",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return 0;
                }
            },
            {
                name: "rings_end",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return 0;
                }
            },
            {
                name: "rings_frequency",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return 0;
                }
            },
            {
                name: "rings_opacity",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return 0;
                }
            },
            {
                name: "rings_color",
                type: UniformEnumType.COLOR_3,
                get: () => {
                    return new Color3(0, 0, 0);
                }
            }
        ];
    }

    getShaderUniforms(): ShaderUniforms {
        return [
            {
                name: "rings_start",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return this.ringStart;
                }
            },
            {
                name: "rings_end",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return this.ringEnd;
                }
            },
            {
                name: "rings_frequency",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return this.ringFrequency;
                }
            },
            {
                name: "rings_opacity",
                type: UniformEnumType.FLOAT,
                get: () => {
                    return this.ringOpacity;
                }
            },
            {
                name: "rings_color",
                type: UniformEnumType.COLOR_3,
                get: () => {
                    return this.ringColor;
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
                    name: "rings_lut",
                    type: SamplerEnumType.TEXTURE,
                    get: () => {
                        return lut;
                    }
                }
            ];
        });
    }

    /**
     * Returns the LUT for the rings
     * You cannot await this function as it would block the main thread and cause a deadlock as the LUT is created on the main thread
     * @param scene
     * @private
     */
    private getLUT(scene: Scene): Promise<ProceduralTexture> {
        if (Effect.ShadersStore[`ringsLUTFragmentShader`] === undefined) {
            Effect.ShadersStore[`ringsLUTFragmentShader`] = ringsLUT;
        }

        if (this.ringLut === null) {
            const lut = new ProceduralTexture(
                "ringsLUT",
                {
                    width: 4096,
                    height: 1
                },
                "ringsLUT",
                scene,
                undefined,
                true,
                false
            );
            lut.setFloat("seed", this.offset);
            lut.setFloat("frequency", this.ringFrequency);
            lut.setFloat("ringStart", this.ringStart);
            lut.setFloat("ringEnd", this.ringEnd);
            lut.refreshRate = 0;

            this.ringLut = lut;
        }

        return new Promise((resolve) => {
            if (this.ringLut === null) throw new Error("Ring LUT was null when creating promise");
            this.ringLut.executeWhenReady(() => {
                if (this.ringLut === null) throw new Error("Ring LUT was null when executing when ready");
                resolve(this.ringLut);
            });
        });
    }
}
