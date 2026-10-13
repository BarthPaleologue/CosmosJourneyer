import { describe, expect, it, vi } from "vitest";

import type { GaiaRow } from "../gaia/schemas";
import type { TapClient } from "../tap/client";
import { SimbadClient } from "./client";

const gaiaRow: GaiaRow = {
    source_id: "2635476908753563008",
    designation: "Gaia DR3 2635476908753563008",
    ra: 0,
    dec: 0,
    parallax: 200,
    parallax_over_error: 10,
    ruwe: 1,
    bp_rp: null,
    teff_k: null,
};

describe("SimbadClient", () => {
    it("returns a protocol error instead of partial metadata when a later batch is invalid", async () => {
        const query = vi
            .fn<TapClient["query"]>()
            .mockResolvedValueOnce({
                success: true,
                value: [{ input_id: gaiaRow.designation ?? "", main_id: "GJ 699" }],
            })
            .mockResolvedValueOnce({
                success: true,
                value: [{ input_id: "Gaia DR3 2", main_id: "" }],
            });

        const result = await new SimbadClient({ query }, 1).query([
            gaiaRow,
            { ...gaiaRow, source_id: "2", designation: "Gaia DR3 2" },
        ]);

        expect(result.success).toBe(false);
        expect(!result.success && result.error.kind).toBe("protocol");
        expect(!result.success && result.error.message).toContain("Invalid SIMBAD payload:");
        expect(query).toHaveBeenCalledTimes(2);
    });

    it("returns invalid external rows as protocol errors", async () => {
        const tap: TapClient = {
            query: async () =>
                await Promise.resolve({
                    success: true,
                    value: [{ input_id: gaiaRow.designation ?? "", main_id: "" }],
                }),
        };

        const result = await new SimbadClient(tap).query([gaiaRow]);

        expect(result.success).toBe(false);
        expect(!result.success && result.error.kind).toBe("protocol");
    });

    it("maps validated rows without relying on response order", async () => {
        const tap: TapClient = {
            query: async () =>
                await Promise.resolve({
                    success: true,
                    value: [
                        {
                            input_id: gaiaRow.designation ?? "",
                            main_id: "GJ 699",
                            ids: "NAME Barnard's Star|GJ 699",
                            spectral_type: "M4V",
                            object_type: "PM*",
                            effective_temperature: "3195",
                        },
                    ],
                }),
        };

        const result = await new SimbadClient(tap).query([gaiaRow]);

        expect(result.success && result.value.get(gaiaRow.source_id)).toEqual({
            name: "Barnard's Star",
            spectralType: "M4V",
            objectType: "PM*",
            effectiveTemperature: 3195,
        });
    });
});
