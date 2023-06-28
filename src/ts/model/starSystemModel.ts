import { seededSquirrelNoise } from "squirrel-noise";
import { centeredRand, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../settings";
import { BODY_TYPE } from "./common";
import { generateName } from "../utils/nameGenerator";

enum GENERATION_STEPS {
    NAME,
    NB_STARS = 20,
    GENERATE_STARS = 21,
    NB_PLANETS = 30,
    GENERATE_PLANETS = 200,
    CHOOSE_PLANET_TYPE = 200
}

export class StarSystemModel {
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly name: string;

    constructor(seed: number) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.name = generateName(this.rng, GENERATION_STEPS.NAME);
    }

    getName(): string {
        return this.name;
    }

    getNbStars(): number {
        //return 1 + Math.floor(2 * this.rng(GENERATION_STEPS.NB_STARS));
        return 1;
    }

    getNbPlanets(): number {
        if (this.getBodyTypeOfStar(0) === BODY_TYPE.BLACK_HOLE) return 0; //FIXME: will not apply when more than one star
        return randRangeInt(0, 7, this.rng, GENERATION_STEPS.NB_PLANETS);
    }

    public getStarSeed(index: number) {
        if (index > this.getNbStars()) throw new Error("Star out of bound! " + index);
        return centeredRand(this.rng, GENERATION_STEPS.GENERATE_STARS + index) * Settings.SEED_HALF_RANGE;
    }

    public getBodyTypeOfStar(index: number) {
        if (index > this.getNbStars()) throw new Error("Star out of bound! " + index);
        if (uniformRandBool(0.002, this.rng, GENERATION_STEPS.GENERATE_STARS + index)) return BODY_TYPE.BLACK_HOLE;

        return BODY_TYPE.STAR;
    }

    public getBodyTypeOfPlanet(index: number) {
        if (uniformRandBool(0.5, this.rng, GENERATION_STEPS.CHOOSE_PLANET_TYPE + index)) return BODY_TYPE.TELLURIC;
        return BODY_TYPE.GAS;
    }

    public getPlanetSeed(index: number) {
        return centeredRand(this.rng, GENERATION_STEPS.GENERATE_PLANETS + index) * Settings.SEED_HALF_RANGE;
    }
}
