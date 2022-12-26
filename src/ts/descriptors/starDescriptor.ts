import { seededSquirrelNoise } from "squirrel-noise";
import { clamp } from "terrain-generation";
import { normalRandom } from "extended-random";
import { Color3, Vector3 } from "@babylonjs/core";
import { getRgbFromTemperature } from "../utils/specrend";

enum GENERATION_STEPS {
    NAME,
    TEMPERATURE,
}

export class StarDescriptor {
    readonly rng: (step: number) => number;
    constructor(seed: number) {
        this.rng = seededSquirrelNoise(seed * Number.MAX_SAFE_INTEGER);
    }

    getName(): string {
        return "Star";
    }

    getSurfaceTemperature(): number {
        return clamp(normalRandom(5778, 2000, this.rng, GENERATION_STEPS.TEMPERATURE), 3000, 10000)
    }

    getColor(): Vector3 {
        return getRgbFromTemperature(this.getSurfaceTemperature());
    }
}