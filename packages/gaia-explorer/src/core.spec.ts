import { describe, expect, it } from "vitest";

import { classifyStar } from "./classification";
import { computeParallaxMinMas } from "./config";
import type { GaiaRow } from "./gaia/schemas";
import type { SimbadMetadata } from "./metadata";
import { rowToStar } from "./records";
import { SpatialBinner } from "./spatial";
import {
    estimateTemperatureFromBpRp,
    estimateTemperatureFromSpectralType,
    resolveTemperatureOverrides,
} from "./temperatures";
describe("ported domain", () => {
    it("computes parallax", () => {
        expect(computeParallaxMinMas({ radiusLy: 50, parallaxOverErrorMin: 10, ruweMax: 1.5 })).toBeCloseTo(65.2312);
    });
    it("classifies", () => {
        expect(classifyStar({ name: "x", spectralType: "DA4", objectType: "WD*", effectiveTemperature: 12000 })).toBe(
            "white-dwarf",
        );
        expect(classifyStar({ name: "x", spectralType: null, objectType: "Psr", effectiveTemperature: null })).toBe(
            "neutron-star",
        );
        expect(classifyStar({ name: "x", spectralType: null, objectType: "BH", effectiveTemperature: null })).toBe(
            "black-hole",
        );
        expect(classifyStar(undefined)).toBe("main-sequence");
    });
    it("converts and bins", () => {
        const star = rowToStar({
            source_id: "9007199254740993",
            designation: "Test",
            ra: 0,
            dec: 0,
            parallax: 200,
            parallax_over_error: 10,
            ruwe: 1,
            bp_rp: null,
            teff_k: 5000,
        });
        expect(star?.x).toBeCloseTo(16.3078);
        const binner = new SpatialBinner({ gridSize: 10, halfExtent: 20 });
        expect(star && binner.addStar(star)).toBe(true);
        expect(binner.cubes.get("1:0:0")?.stars[0]?.relative_position[0]).toBeCloseTo(0.63078);
        expect(
            binner.addStar({ name: "Far away", x: 21, y: 0, z: 0, temperature: 5000, sourceId: null, nature: null }),
        ).toBe(false);
    });
    it("ports temperature fallbacks", () => {
        expect(estimateTemperatureFromBpRp(0.82)).toBeGreaterThan(5000);
        expect(estimateTemperatureFromSpectralType("DA5")).toBe(5000);
        expect(estimateTemperatureFromSpectralType("K5")).toBeGreaterThan(3600);
    });
    it("uses temperature fallbacks in priority order", () => {
        const row = (source_id: string, bp_rp: number | null): GaiaRow => ({
            source_id,
            designation: null,
            ra: 0,
            dec: 0,
            parallax: 100,
            parallax_over_error: 10,
            ruwe: 1,
            bp_rp,
            teff_k: null,
        });
        const rows = [row("1", 0.82), row("2", null), row("3", null)];
        const metadata = new Map<string, SimbadMetadata>([
            ["1", { name: "One", spectralType: "M8", objectType: "*", effectiveTemperature: 2450 }],
            ["2", { name: "Two", spectralType: "K5", objectType: "*", effectiveTemperature: null }],
        ]);
        const overrides = resolveTemperatureOverrides(rows, metadata);
        expect(overrides.get("1")).toBe(2450);
        expect(overrides.get("2")).toBeGreaterThan(3600);
        expect(overrides.get("3")).toBe(3500);
    });
});
