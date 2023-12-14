import { Color3 } from "@babylonjs/core/Maths/math.color";
import { normalRandom, randRange } from "extended-random";
import { clamp } from "terrain-generation";
import { ShaderUniforms, UniformEnumType } from "../../uberCore/postProcesses/types";
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
    private offset: number;

    constructor(rng: (step: number) => number) {
        this.ringStart = randRange(1.8, 2.2, rng, 1400);
        this.ringEnd = randRange(2.1, 4.0, rng, 1410);
        this.ringFrequency = 30.0;
        this.ringOpacity = clamp(normalRandom(0.7, 0.1, rng, 1420), 0, 1);
        this.ringColor = new Color3(214, 168, 122).scaleInPlace(randRange(1.0, 1.5, rng, 1430) / 255);

        this.offset = randRange(-100, 100, rng, 1440);
    }

    static getEmptyShaderUniforms(): ShaderUniforms {
        return [
            {
                name: "rings_start",
                type: UniformEnumType.Float,
                get: () => {
                    return 0;
                }
            },
            {
                name: "rings_end",
                type: UniformEnumType.Float,
                get: () => {
                    return 0;
                }
            },
            {
                name: "rings_frequency",
                type: UniformEnumType.Float,
                get: () => {
                    return 0;
                }
            },
            {
                name: "rings_opacity",
                type: UniformEnumType.Float,
                get: () => {
                    return 0;
                }
            },
            {
                name: "rings_color",
                type: UniformEnumType.Color3,
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
                type: UniformEnumType.Float,
                get: () => {
                    return this.ringStart;
                }
            },
            {
                name: "rings_end",
                type: UniformEnumType.Float,
                get: () => {
                    return this.ringEnd;
                }
            },
            {
                name: "rings_frequency",
                type: UniformEnumType.Float,
                get: () => {
                    return this.ringFrequency;
                }
            },
            {
                name: "rings_opacity",
                type: UniformEnumType.Float,
                get: () => {
                    return this.ringOpacity;
                }
            },
            {
                name: "rings_color",
                type: UniformEnumType.Color3,
                get: () => {
                    return this.ringColor;
                }
            }
        ];
    }

    public getLUT(scene: Scene): Promise<ProceduralTexture> {
        if(Effect.ShadersStore[`ringsLUTFragmentShader`] === undefined) {
            Effect.ShadersStore[`ringsLUTFragmentShader`] = ringsLUT;
        }

        if(this.ringLut === null) {
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

        return new Promise((resolve, reject) => {
            this.ringLut?.executeWhenReady(() => {
                if(this.ringLut === null) throw new Error("Ring LUT was null when executing when ready");
                resolve(this.ringLut);
            });
        });
    }
}
