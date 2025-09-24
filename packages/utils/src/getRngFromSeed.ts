import { seededSquirrelNoise } from "squirrel-noise";

export function getRngFromSeed(seed: number): (index: number) => number {
    return seededSquirrelNoise(seed);
}
