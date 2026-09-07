import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { describe, expect, it } from "vitest";

import { computeReticleMatch, getPreciseAimSinSquared } from "./computeReticleMatch";

describe("computeReticleMatch", () => {
    const forward = Vector3.Forward();
    const preciseAim = getPreciseAimSinSquared(Math.PI / 3);

    it("permits precise aim for point targets without silhouette assistance", () => {
        expect(computeReticleMatch(new Vector3(0, 0, 100), forward, 0, preciseAim)).toEqual({
            kind: "precise",
            scoreSquared: 0,
        });
        expect(computeReticleMatch(new Vector3(40, 0, 100), forward, 0, preciseAim)).toBeNull();
    });

    it.each([30, 60, 100])("captures a radius of 25%% of viewport height at a %s-degree vertical FOV", (degrees) => {
        const verticalFov = (degrees * Math.PI) / 180;
        for (const fraction of [0.249, 0.251]) {
            const miss = 2 * fraction * Math.tan(verticalFov / 2) * 100;
            for (const offset of [new Vector3(miss, 0, 100), new Vector3(0, miss, 100)]) {
                expect(
                    computeReticleMatch(offset, forward, 0.01, getPreciseAimSinSquared(verticalFov))?.kind ?? null,
                ).toBe(fraction < 0.25 ? "precise" : null);
            }
        }
    });

    it("only permits precise aim inside or on an enclosing sphere", () => {
        expect(computeReticleMatch(new Vector3(1, 0, 2), forward, 100, preciseAim)).toBeNull();
        expect(computeReticleMatch(new Vector3(3, 0, 4), forward, 5, preciseAim)).toBeNull();
        expect(computeReticleMatch(new Vector3(0, 0, 2), forward, 100, preciseAim)?.kind).toBe("precise");
    });

    it("assists silhouette hits outside the precise cone, including tangency", () => {
        expect(computeReticleMatch(new Vector3(40, 0, 100), forward, 40, preciseAim)).toEqual({
            kind: "assisted",
            scoreSquared: 1,
        });
        expect(computeReticleMatch(new Vector3(40.001, 0, 100), forward, 40, preciseAim)).toBeNull();
    });
});
