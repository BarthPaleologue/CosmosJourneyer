import { seededSquirrelNoise } from "squirrel-noise";
import { clamp } from "terrain-generation";
import { normalRandom, randRange, uniformRandBool } from "extended-random";
import { Vector3 } from "@babylonjs/core";
import { getRgbFromTemperature } from "../utils/specrend";
import { Settings } from "../settings";

enum GENERATION_STEPS {
    NAME,
    TEMPERATURE = 1100,
    RADIUS = 1000,
    RINGS = 1200
}

export enum STAR_TYPE {
    O,
    B,
    A,
    F,
    G,
    K,
    M,
}

export class StarDescriptor {
    readonly rng: (step: number) => number;

    readonly name: string;

    readonly surfaceTemperature: number;
    readonly surfaceColor: Vector3;
    private readonly type: STAR_TYPE;
    readonly radius: number;

    readonly mass = 1000;
    readonly rotationPeriod = 24 * 60 * 60;

    static RING_PROPORTION = 0.2;
    readonly hasRings: boolean;

    constructor(seed: number) {
        this.rng = seededSquirrelNoise(seed * Number.MAX_SAFE_INTEGER);
        this.name = "Star";

        this.surfaceTemperature = clamp(normalRandom(5778, 2000, this.rng, GENERATION_STEPS.TEMPERATURE), 3000, 10000);
        this.surfaceColor = getRgbFromTemperature(this.surfaceTemperature);

        if (this.surfaceTemperature < 3500) this.type = STAR_TYPE.M;
        else if (this.surfaceTemperature < 5000) this.type = STAR_TYPE.K;
        else if (this.surfaceTemperature < 6000) this.type = STAR_TYPE.G;
        else if (this.surfaceTemperature < 7500) this.type = STAR_TYPE.F;
        else if (this.surfaceTemperature < 10000) this.type = STAR_TYPE.A;
        else if (this.surfaceTemperature < 30000) this.type = STAR_TYPE.B;
        else this.type = STAR_TYPE.O;

        //TODO: make it dependent on star type
        this.radius = randRange(50, 200, this.rng, GENERATION_STEPS.RADIUS) * Settings.EARTH_RADIUS;

        this.hasRings = uniformRandBool(StarDescriptor.RING_PROPORTION, this.rng, GENERATION_STEPS.RINGS);
    }

    getStellarType(): string {
        switch (this.type) {
            case STAR_TYPE.O:
                return "O";
            case STAR_TYPE.B:
                return "B";
            case STAR_TYPE.A:
                return "A";
            case STAR_TYPE.F:
                return "F";
            case STAR_TYPE.G:
                return "G";
            case STAR_TYPE.K:
                return "K";
            case STAR_TYPE.M:
                return "M";
        }
    }
}