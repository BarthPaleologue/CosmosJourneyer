import { seededSquirrelNoise } from "squirrel-noise";
import { Settings } from "../settings";
import { makeNoise3D } from "fast-simplex-noise";
import { getStarGalacticPosition } from "../utils/starSystemCoordinatesUtils";
import { StarSystemCoordinates } from "../starSystem/starSystemModel";

const materialistSpiritualistRng = seededSquirrelNoise(Settings.POWER_PLAY_SEED);
let materialistSpiritualistSampleStep = 0;
const materialistSpiritalistPerlin = makeNoise3D(() => {
    return materialistSpiritualistRng(materialistSpiritualistSampleStep++);
});

export const MaterialistSpiritalistAxis = (x: number, y: number, z: number) => materialistSpiritalistPerlin(x * 0.2, y * 0.2, z * 0.2) * 0.5 + 0.5;

const capitalistCommunistRng = seededSquirrelNoise(Settings.POWER_PLAY_SEED + 598);
let capitalistCommunistSampleStep = 0;
const capitalistCommunistPerlin = makeNoise3D(() => {
    return capitalistCommunistRng(capitalistCommunistSampleStep++);
});

export const CapitalistCommunistAxis = (x: number, y: number, z: number) => capitalistCommunistPerlin(x * 0.2, y * 0.2, z * 0.2) * 0.5 + 0.5;

export function getPowerPlayData(systemCoordinates: StarSystemCoordinates) {
    const coords = getStarGalacticPosition(systemCoordinates);

    return {
        materialistSpiritualist: MaterialistSpiritalistAxis(coords.x, coords.y, coords.z),
        capitalistCommunist: CapitalistCommunistAxis(coords.x, coords.y, coords.z)
    };
}
