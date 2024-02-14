//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { seededSquirrelNoise } from "squirrel-noise";
import { makeNoise3D } from "fast-simplex-noise";

export const Settings = {
    UNIVERSE_SEED: Math.PI,
    EARTH_RADIUS: 1000e3, // target is 6000e3
    AU: 150e9, // target is 150e9

    VERTEX_RESOLUTION: 64,
    MIN_DISTANCE_BETWEEN_VERTICES: 1.5,

    CLOUD_LAYER_HEIGHT: 7e3,
    ATMOSPHERE_HEIGHT: 100e3,
    OCEAN_DEPTH: 7e3,

    TIME_MULTIPLIER: 1,
    CHUNK_RENDERING_DISTANCE_MULTIPLIER: 2,
    ENABLE_VOLUMETRIC_CLOUDS: false,
    SEED_HALF_RANGE: 1e4,
    C: 299792458,
    FOV: (92 * Math.PI) / 180,

    MAIN_FONT: "Nasalization",
};

export const CollisionMask = {
    ENVIRONMENT: 0b00000001,
    DYNAMIC_OBJECTS: 0b00000010
};

const seedableRng = seededSquirrelNoise(Settings.UNIVERSE_SEED);
let step = 0;
const perlinRng = makeNoise3D(() => {
    return seedableRng(step++);
});
export const UniverseDensity = (x: number, y: number, z: number) => (1.0 - Math.abs(perlinRng(x * 0.2, y * 0.2, z * 0.2))) ** 8;
