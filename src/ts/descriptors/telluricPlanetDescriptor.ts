import { seededSquirrelNoise } from "squirrel-noise";
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../settings";

enum GENERATION_STEPS {
    RADIUS = 1000,
    PRESSURE = 1100,
    WATER_AMOUNT = 1200,
    RINGS = 1400,
    TERRAIN = 1500,
    NB_MOONS = 10,
    MOONS = 11,
}

export class TelluricPlanetDescriptor {
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly hasRings: boolean;

    readonly nbMoons: number;

    constructor(seed: number) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.radius = Math.max(0.3, normalRandom(1.0, 0.1, this.rng, GENERATION_STEPS.RADIUS)) * Settings.EARTH_RADIUS;

        this.hasRings = uniformRandBool(0.6, this.rng, GENERATION_STEPS.RINGS);

        this.nbMoons = randRangeInt(0, 2, this.rng, GENERATION_STEPS.NB_MOONS);
    }

    getMoonSeed(index: number) {
        if(index > this.nbMoons) throw new Error("Moon out of bound! " + index);
        return this.rng(GENERATION_STEPS.MOONS + index);
    }
}