import { describe, expect, it } from "vitest";

import type { TapClient } from "../tap/client";
import { GaiaClient } from "./client";
const row = {
    source_id: "2635476908753563008",
    designation: "Gaia DR3 2635476908753563008",
    ra: "0",
    dec: "0",
    parallax: "200",
    parallax_over_error: "10",
    ruwe: "1",
    bp_rp: "",
    teff_k: "",
};
describe("GaiaClient", () => {
    it("preserves source IDs beyond Number.MAX_SAFE_INTEGER", async () => {
        const tap: TapClient = { query: async () => await Promise.resolve({ success: true, value: [row] }) };
        const result = await new GaiaClient(tap).query({ radiusLy: 50, parallaxOverErrorMin: 10, ruweMax: 10 });
        expect(result.success && result.value[0]?.source_id).toBe("2635476908753563008");
    });
    it("returns validation errors", async () => {
        const tap: TapClient = {
            query: async () => await Promise.resolve({ success: true, value: [{ ...row, ra: "nope" }] }),
        };
        expect((await new GaiaClient(tap).query({ radiusLy: 50, parallaxOverErrorMin: 10, ruweMax: 10 })).success).toBe(
            false,
        );
    });
});
