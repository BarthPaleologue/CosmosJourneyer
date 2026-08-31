import { describe, expect, it } from "vitest";

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
