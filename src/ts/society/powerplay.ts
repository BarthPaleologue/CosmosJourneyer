import { Settings } from "../settings";
import { makeNoise3D } from "fast-simplex-noise";
import { getStarGalacticPosition } from "../utils/coordinates/starSystemCoordinatesUtils";

import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";
import { getRngFromSeed } from "../utils/getRngFromSeed";

const materialistSpiritualistRng = getRngFromSeed(Settings.POWER_PLAY_SEED);
let materialistSpiritualistSampleStep = 0;
const materialistSpiritualistPerlin = makeNoise3D(() => {
    return materialistSpiritualistRng(materialistSpiritualistSampleStep++);
});

export const MaterialistSpiritualistAxis = (x: number, y: number, z: number) => materialistSpiritualistPerlin(x * 0.2, y * 0.2, z * 0.2) * 0.5 + 0.5;

const capitalistCommunistRng = getRngFromSeed(Settings.POWER_PLAY_SEED + 598);
let capitalistCommunistSampleStep = 0;
const capitalistCommunistPerlin = makeNoise3D(() => {
    return capitalistCommunistRng(capitalistCommunistSampleStep++);
});

export const CapitalistCommunistAxis = (x: number, y: number, z: number) => capitalistCommunistPerlin(x * 0.2, y * 0.2, z * 0.2) * 0.5 + 0.5;

export function getPowerPlayData(systemCoordinates: StarSystemCoordinates) {
    const coords = getStarGalacticPosition(systemCoordinates);

    return {
        materialistSpiritualist: MaterialistSpiritualistAxis(coords.x, coords.y, coords.z),
        capitalistCommunist: CapitalistCommunistAxis(coords.x, coords.y, coords.z)
    };
}
