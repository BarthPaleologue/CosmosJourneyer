//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { makeNoise3D } from "fast-simplex-noise";

import { getRngFromSeed } from "@/utils/getRngFromSeed";
import type { Vector3Like } from "@/utils/types";

import { Settings } from "@/settings";

const materialistSpiritualistRng = getRngFromSeed(Settings.POWER_PLAY_SEED);
let materialistSpiritualistSampleStep = 0;
const materialistSpiritualistPerlin = makeNoise3D(() => {
    return materialistSpiritualistRng(materialistSpiritualistSampleStep++);
});

export const MaterialistSpiritualistAxis = (x: number, y: number, z: number) =>
    materialistSpiritualistPerlin(x * 0.2, y * 0.2, z * 0.2) * 0.5 + 0.5;

const capitalistCommunistRng = getRngFromSeed(Settings.POWER_PLAY_SEED + 598);
let capitalistCommunistSampleStep = 0;
const capitalistCommunistPerlin = makeNoise3D(() => {
    return capitalistCommunistRng(capitalistCommunistSampleStep++);
});

export const CapitalistCommunistAxis = (x: number, y: number, z: number) =>
    capitalistCommunistPerlin(x * 0.2, y * 0.2, z * 0.2) * 0.5 + 0.5;

export function getPowerPlayData(systemGalacticPosition: Vector3Like) {
    const coords = systemGalacticPosition;

    return {
        materialistSpiritualist: MaterialistSpiritualistAxis(coords.x, coords.y, coords.z),
        capitalistCommunist: CapitalistCommunistAxis(coords.x, coords.y, coords.z),
    };
}
