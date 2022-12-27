import { seededSquirrelNoise } from "squirrel-noise";
import { randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../settings";

enum GENERATION_STEPS {
    RADIUS = 1000,
    RINGS = 1200,
    MOONS = 10,
}

export class GasPlanetDescriptor {
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly hasRings: boolean;
    constructor(seed: number) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.radius = randRangeInt(Settings.EARTH_RADIUS * 4, Settings.EARTH_RADIUS * 20, this.rng, GENERATION_STEPS.RADIUS);

        this.hasRings = uniformRandBool(0.8, this.rng, GENERATION_STEPS.RINGS);
    }

    getNbMoons(): number {
        return 0;
    }

    getMoonSeed(index: number) {
        if(index > this.getNbMoons()) throw new Error("Moon out of bound! " + index);
        return this.rng(GENERATION_STEPS.MOONS + index);
    }
}