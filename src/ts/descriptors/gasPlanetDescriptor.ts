import { seededSquirrelNoise } from "squirrel-noise";
import { randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../settings";
import { BodyDescriptor } from "./interfaces";

enum GENERATION_STEPS {
    RADIUS = 1000,
    RINGS = 1200,
    NB_MOONS = 10,
    MOONS = 11,
}

export class GasPlanetDescriptor implements BodyDescriptor {
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly hasRings: boolean;

    readonly nbMoons: number;

    constructor(seed: number) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.radius = randRangeInt(Settings.EARTH_RADIUS * 4, Settings.EARTH_RADIUS * 20, this.rng, GENERATION_STEPS.RADIUS);

        this.hasRings = uniformRandBool(0.8, this.rng, GENERATION_STEPS.RINGS);

        this.nbMoons = randRangeInt(0, 3, this.rng, GENERATION_STEPS.NB_MOONS);
    }

    getMoonSeed(index: number) {
        if (index > this.nbMoons) throw new Error("Moon out of bound! " + index);
        return this.rng(GENERATION_STEPS.MOONS + index);
    }
}