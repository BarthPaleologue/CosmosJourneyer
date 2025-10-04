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

import { Tools } from "@babylonjs/core/Misc/tools";

export const Settings = {
    UNIVERSE_SEED: Math.PI,

    POWER_PLAY_SEED: 77,

    EARTH_RADIUS: 1000e3, // target is 6000e3

    VERTEX_RESOLUTION: 64,
    MIN_DISTANCE_BETWEEN_VERTICES: 1.5,

    CLOUD_LAYER_HEIGHT: 7e3,
    EARTH_ATMOSPHERE_THICKNESS: 100e3,
    OCEAN_DEPTH: 7e3,

    TIME_MULTIPLIER: 1,
    CHUNK_RENDERING_DISTANCE_MULTIPLIER: 2,
    ENABLE_VOLUMETRIC_CLOUDS: false,
    SEED_HALF_RANGE: 1e4,

    FLOATING_ORIGIN_THRESHOLD: 500,

    HUMAN_BUBBLE_RADIUS_LY: 100,

    VISIBLE_NEIGHBORHOOD_MAX_RADIUS_LY: 20,

    CREDIT_SYMBOL: "₽",

    /**
     * Size of each star
     */
    STAR_SECTOR_SIZE: 20,

    /**
     * The average daily intake for a human being in kcal/day
     * It is 2500 for males and 2000 for females, hence 2250.
     */
    INDIVIDUAL_AVERAGE_DAILY_INTAKE: 2250,

    /**
     * Hydroponic agriculture can be 250% more productive than conventional agriculture.
     */
    HYDROPONIC_TO_CONVENTIONAL_RATIO: 3.5,

    FOV: Tools.ToRadians(60),

    LANDING_PAD_ASPECT_RATIO: 1.618,

    RINGS_FADE_OUT_DISTANCE: 15_000,

    MAIN_FONT: "Nasalization",

    MAX_AUTO_SAVES: 5,

    SHARED_POSITION_SAVE_UUID: "sharedPositionSave",

    TUTORIAL_SAVE_UUID: "00000000-0000-0000-0000-000000000000",

    QUALITY_CHARS: "FEDCBA",
};

export const CollisionMask = {
    ENVIRONMENT: 0b00000001,
    DYNAMIC_OBJECTS: 0b00000010,
} as const;
