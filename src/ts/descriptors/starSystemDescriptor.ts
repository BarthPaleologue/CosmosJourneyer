import { seededSquirrelNoise } from "squirrel-noise";

enum GENERATION_STEPS {
    NAME,
    NB_STARS = 20,
    STARS = 21
}

export class StarSystemDescriptor {
    readonly rng: (step: number) => number;

    constructor(seed: number) {
        this.rng = seededSquirrelNoise(seed * Number.MAX_SAFE_INTEGER);
    }

    getName(): string {
        //TODO: procedural name generation
        return this.rng(GENERATION_STEPS.NAME).toString();
    }

    getNbStars(): number {
        // this.rng(GENERATION_STEPS.NB_STARS);
        return 1;
    }

    getStarSeed(index: number) {
        if(index > this.getNbStars()) throw new Error("Star out of bound! " + index);
        return this.rng(GENERATION_STEPS.STARS + index);
    }
}