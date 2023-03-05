import { seededSquirrelNoise } from "squirrel-noise";
import { centeredRand, randRangeInt } from "extended-random";
import { Settings } from "../settings";

enum GENERATION_STEPS {
    NAME,
    NB_STARS = 20,
    GENERATE_STARS = 21,
    NB_PLANETS = 30,
    GENERATE_PLANETS = 200
}

export class StarSystemDescriptor {
    readonly seed: number;
    readonly rng: (step: number) => number;

    constructor(seed: number) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);
    }

    getName(): string {
        //TODO: procedural name generation
        return this.rng(GENERATION_STEPS.NAME).toString();
    }

    getNbStars(): number {
        // this.rng(GENERATION_STEPS.NB_STARS);
        return 1;
    }

    getNbPlanets(): number {
        return randRangeInt(0, 7, this.rng, GENERATION_STEPS.NB_PLANETS);
    }

    public getStarSeed(index: number) {
        if (index > this.getNbStars()) throw new Error("Star out of bound! " + index);
        return centeredRand(this.rng, GENERATION_STEPS.GENERATE_STARS + index) * Settings.SEED_HALF_RANGE;
    }

    public getPlanetSeed(index: number) {
        return centeredRand(this.rng, GENERATION_STEPS.GENERATE_PLANETS + index) * Settings.SEED_HALF_RANGE;
    }
}
