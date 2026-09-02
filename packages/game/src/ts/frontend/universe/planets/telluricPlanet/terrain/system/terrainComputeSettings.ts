//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { TerrainSettings } from "@cosmos-journeyer/universe-model";

export type TerrainComputeSettings = readonly [
    seed: number,
    continentBaseHeight: number,
    continentsFragmentation: number,
    continentsFrequency: number,
    maxMountainHeight: number,
    mountainsFrequency: number,
    maxBumpHeight: number,
    bumpsFrequency: number,
    terraceHeight: number,
    craterStrength: number,
    craterFrequency: number,
    erosion: number,
];

export function createTerrainComputeSettings(
    seed: number,
    settings: DeepReadonly<TerrainSettings>,
    hasAtmosphere: boolean,
): TerrainComputeSettings {
    const maximumRelief = Math.max(settings.max_mountain_height, settings.max_bump_height, 1_000);

    return [
        seed,
        settings.continent_base_height,
        settings.continents_fragmentation,
        settings.continents_frequency,
        settings.max_mountain_height,
        settings.mountains_frequency,
        settings.max_bump_height,
        settings.bumps_frequency,
        Math.max(settings.max_mountain_height * 0.12, 250),
        hasAtmosphere ? 0 : maximumRelief * 0.45,
        Math.max(settings.bumps_frequency * 0.5, 8),
        0.55,
    ];
}
