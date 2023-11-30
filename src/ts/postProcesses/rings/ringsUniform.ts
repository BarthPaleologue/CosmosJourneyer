import { Color3 } from "@babylonjs/core/Maths/math.color";
import { normalRandom, randRange } from "extended-random";
import { clamp } from "terrain-generation";
import { ShaderUniforms, UniformEnumType } from "../../uberCore/postProcesses/types";

export class RingsUniforms {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
    ringColor: Color3;

    constructor(rng: (step: number) => number) {
        this.ringStart = randRange(1.8, 2.2, rng, 1400);
        this.ringEnd = randRange(2.1, 4.0, rng, 1410);
        this.ringFrequency = 30.0;
        this.ringOpacity = clamp(normalRandom(0.7, 0.1, rng, 1420), 0, 1);
        this.ringColor = new Color3(214, 168, 122).scaleInPlace(randRange(1.0, 1.5, rng, 1430) / 255);
    }

    getShaderUniforms(): ShaderUniforms {
        return [
            {
                name: "rings.start",
                type: UniformEnumType.Float,
                get: () => {
                    return this.ringStart;
                }
            },
            {
                name: "rings.end",
                type: UniformEnumType.Float,
                get: () => {
                    return this.ringEnd;
                }
            },
            {
                name: "rings.frequency",
                type: UniformEnumType.Float,
                get: () => {
                    return this.ringFrequency;
                }
            },
            {
                name: "rings.opacity",
                type: UniformEnumType.Float,
                get: () => {
                    return this.ringOpacity;
                }
            },
            {
                name: "rings.color",
                type: UniformEnumType.Color3,
                get: () => {
                    return this.ringColor;
                }
            }
        ];
    }
}
