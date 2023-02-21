import { seededSquirrelNoise } from "squirrel-noise";
import { randRangeInt } from "extended-random";

enum GENERATION_STEPS {
    NAME,
    NB_STARS = 20,
    STARS = 21,
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
        return randRangeInt(0, 2, this.rng, GENERATION_STEPS.NB_PLANETS);
    }

    getStarSeed(index: number) {
        if (index > this.getNbStars()) throw new Error("Star out of bound! " + index);
        return (this.rng(GENERATION_STEPS.STARS + index) * 2 - 1) * 100;
    }

    public getPlanetSeed(index: number) {
        return (2 * this.rng(GENERATION_STEPS.GENERATE_PLANETS + index) - 1) * 1000;
    }
}
