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

import {
    seededLegacySquirrelNoise,
    legacySquirrelNoise,
    getRngFromSeed,
    seededSquirrelNoise,
    squirrelNoise,
} from "./index";

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

describe("modern squirrel noise", () => {
    it("returns deterministic values in [0, 1)", () => {
        for (const seed of [0, 42, -42, 123456789, -987654321]) {
            for (const index of indices) {
                const value = squirrelNoise(seed, index);
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThan(1);
                expect(squirrelNoise(seed, index)).toBe(value);
            }
        }
    });

    it("is order-independent through the seeded wrapper", () => {
        const rng = seededSquirrelNoise(42);
        const forward = indices.map(rng);
        expect(indices.toReversed().map(seededSquirrelNoise(42))).toEqual(forward.toReversed());
    });

    it("depends on both seed and index", () => {
        expect(squirrelNoise(0, 1)).not.toBe(squirrelNoise(1, 1));
        expect(squirrelNoise(42, 1)).not.toBe(squirrelNoise(42, 2));
    });

    it("matches captured reference values", () => {
        // Reference implementation: SquirrelNoise5, https://gist.github.com/kevinmoran/0198d8e9de0da7057abe8b8b34d50f86
        const reference: [number, number[]][] = [
            [
                0,
                [
                    0.9584647815208882, 0.059389577712863684, 0.1818354674614966, 0.8865617162082344,
                    0.022372808307409286, 0.4191903949249536, 0.2869785721413791,
                ],
            ],
            [
                42,
                [
                    0.7869582020211965, 0.48974785418249667, 0.731001524021849, 0.1525185597129166, 0.3825406455434859,
                    0.9102847184985876, 0.323752811178565,
                ],
            ],
        ];
        for (const [seed, expected] of reference) {
            expect(indices.map((index) => squirrelNoise(seed, index))).toEqual(expected);
            expect(indices.map(seededSquirrelNoise(seed))).toEqual(expected);
        }
    });
});
