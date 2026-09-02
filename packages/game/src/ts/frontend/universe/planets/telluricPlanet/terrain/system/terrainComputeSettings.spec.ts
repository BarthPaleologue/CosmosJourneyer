//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, test } from "vitest";

import { createTerrainComputeSettings } from "./terrainComputeSettings";

const terrainSettings = {
    continent_base_height: 2_000,
    continents_fragmentation: 0.4,
    continents_frequency: 3,
    max_mountain_height: 10_000,
    mountains_frequency: 60,
    max_bump_height: 1_000,
    bumps_frequency: 30,
} as const;

describe(createTerrainComputeSettings.name, () => {
    test("derives improved terrain controls from the current terrain model", () => {
        expect(createTerrainComputeSettings(42, terrainSettings, false)).toEqual([
            42, 2_000, 0.4, 3, 10_000, 60, 1_000, 30, 1_200, 4_500, 15, 0.55,
        ]);
    });

    test("disables preserved craters on worlds with atmospheric erosion", () => {
        expect(createTerrainComputeSettings(42, terrainSettings, true)[9]).toBe(0);
    });
});
