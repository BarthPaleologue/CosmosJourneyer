//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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
    Tau,
    clamp,
    findMinimumNewtonRaphson,
    gcd,
    lerp,
    lerpAngle,
    lerpSmooth,
    mod,
    moveTowards,
    remap,
    smoothstep,
    triangleWave,
} from "./math";

describe("math utilities", () => {
    describe("clamp", () => {
        it("keeps values inside the provided bounds", () => {
            expect(clamp(5, 0, 10)).toBe(5);
            expect(clamp(-1, 0, 10)).toBe(0);
            expect(clamp(11, 0, 10)).toBe(10);
        });
    });

    describe("moveTowards", () => {
        it("moves by at most the given rate without overshooting", () => {
            expect(moveTowards(0, 10, 3)).toBe(3);
            expect(moveTowards(10, 0, 3)).toBe(7);
            expect(moveTowards(8, 10, 3)).toBe(10);
            expect(moveTowards(2, 0, 3)).toBe(0);
        });
    });

    describe("smoothstep", () => {
        it("clamps outside the edges and interpolates smoothly between them", () => {
            expect(smoothstep(0, 10, -1)).toBe(0);
            expect(smoothstep(0, 10, 0)).toBe(0);
            expect(smoothstep(0, 10, 5)).toBeCloseTo(0.5);
            expect(smoothstep(0, 10, 10)).toBe(1);
            expect(smoothstep(0, 10, 11)).toBe(1);
        });
    });

    describe("triangleWave", () => {
        it("returns a periodic triangular wave between zero and one", () => {
            expect(triangleWave(0)).toBe(0);
            expect(triangleWave(0.25)).toBe(0.5);
            expect(triangleWave(0.5)).toBe(1);
            expect(triangleWave(0.75)).toBe(0.5);
            expect(triangleWave(1)).toBe(0);
            expect(triangleWave(-0.25)).toBe(0.5);
        });
    });

    describe("remap", () => {
        it("maps a value from one interval to another", () => {
            expect(remap(5, 0, 10, 0, 100)).toBe(50);
            expect(remap(0.25, 0, 1, 10, 20)).toBe(12.5);
            expect(remap(5, 0, 10, 100, 0)).toBe(50);
        });
    });

    describe("gcd", () => {
        it("returns the greatest common divisor", () => {
            expect(gcd(54, 24)).toBe(6);
            expect(gcd(17, 13)).toBe(1);
            expect(gcd(12, 0)).toBe(12);
        });
    });

    describe("findMinimumNewtonRaphson", () => {
        it("finds a zero of the provided function", () => {
            const result = findMinimumNewtonRaphson((x) => x * x - 9, 4);

            expect(result).toBeCloseTo(3);
        });
    });

    describe("lerp", () => {
        it("linearly interpolates between two values", () => {
            expect(lerp(10, 20, 0)).toBe(10);
            expect(lerp(10, 20, 0.25)).toBe(12.5);
            expect(lerp(10, 20, 1)).toBe(20);
        });
    });

    describe("mod", () => {
        it("returns a positive remainder for positive and negative values", () => {
            expect(mod(5, 3)).toBe(2);
            expect(mod(-1, 3)).toBe(2);
            expect(mod(-4, 3)).toBe(2);
        });
    });

    describe("lerpAngle", () => {
        it("interpolates angles through the shortest path", () => {
            expect(lerpAngle(0, Math.PI, 0.5)).toBeCloseTo(-Math.PI / 2);
            expect(lerpAngle(0.1, Tau - 0.1, 0.5)).toBeCloseTo(0);
            expect(lerpAngle(Tau - 0.1, 0.1, 0.5)).toBeCloseTo(Tau);
        });
    });

    describe("lerpSmooth", () => {
        it("moves halfway to the target after one half-life", () => {
            expect(lerpSmooth(0, 10, 2, 2)).toBeCloseTo(5);
            expect(lerpSmooth(0, 10, 2, 4)).toBeCloseTo(7.5);
        });
    });
});
