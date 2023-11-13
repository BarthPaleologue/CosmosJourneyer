import { centeredRand } from "extended-random";
import { GENERATION_STEPS, PlanemoModel } from "../model/common";
import { Settings } from "../settings";


export function getMoonSeed(model: PlanemoModel, index: number) {
    if (index > model.nbMoons) throw new Error("Moon out of bound! " + index);
    return centeredRand(model.rng, GENERATION_STEPS.MOONS + index) * Settings.SEED_HALF_RANGE;
}
