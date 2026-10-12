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

import { describe, expect, it } from "vitest";

import { seededLegacySquirrelNoise, legacySquirrelNoise, getRngFromSeed } from "./index";

// Captured from the installed squirrel-noise@1.0.0 on main before extraction.
const indices = [-100, -1, 0, 1, 2, 100, 1000000];
const cases: [number, number[]][] = [
    [
        0,
        [
            0.07015963647056354, 0.732061174107744, 0.6192239865750186, 0.9913731464144648, 0.9804308707734714,
            0.7745464661971416, 0.3860328036295403,
        ],
    ],
    [
        42,
        [
            0.7056679887257833, 0.7631902800701513, 0.11769841477167718, 0.8017396474265213, 0.5257920816195161,
            0.18054418553623566, 0.4662663990008954,
        ],
    ],
    [
        -42,
        [
            0.2834293294155176, 0.3800117757078315, 0.990064047272347, 0.08952726427909326, 0.30064764493175206,
            0.40555363353600427, 0.3852653509868613,
        ],
    ],
    [
        123456789,
        [
            0.21415292388487278, 0.5159458017516629, 0.9802914904338734, 0.12984826375257608, 0.980593607751929,
            0.9302928810614594, 0.47912213880527865,
        ],
    ],
    [
        -987654321,
        [
            0.2023269060078668, 0.940676092142554, 0.7352879074100814, 0.6431036017104534, 0.3479145552720477,
            0.42272250746503587, 0.10262826229568024,
        ],
    ],
];
describe("indexed RNG compatibility", () => {
    it.each(cases)("preserves seed %s", (seed, expected) => {
        expect(indices.map((index) => legacySquirrelNoise(seed, index))).toEqual(expected);
        expect(indices.map(seededLegacySquirrelNoise(seed))).toEqual(expected);
        expect(indices.map(getRngFromSeed(seed))).toEqual(expected);
        // Indexed samples do not depend on call order.
        expect(indices.toReversed().map(getRngFromSeed(seed))).toEqual(expected.toReversed());
    });
});
