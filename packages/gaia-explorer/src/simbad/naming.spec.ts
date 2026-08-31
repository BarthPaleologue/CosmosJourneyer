import { describe, expect, it } from "vitest";

import { chooseBestName, expandBayerFlamsteed } from "./naming";

describe("SIMBAD naming", () => {
    it("expands Bayer and Flamsteed names in constellations omitted by the first TypeScript port", () => {
        expect(expandBayerFlamsteed("bet Cas")).toBe("Beta Cassiopeiae");
        expect(expandBayerFlamsteed("61 Cyg")).toBe("61 Cygni");
    });

    it("prefers any proper name identified by SIMBAD", () => {
        expect(chooseBestName("HIP 7588", ["NAME A Newly Named Star", "alf Eri"], "Gaia DR3 1")).toBe(
            "A Newly Named Star",
        );
    });

    it("prefers an official IAU name over other SIMBAD names", () => {
        expect(chooseBestName("* ksi Pup", ["NAME Asmidiske", "NAME-IAU Azmidi"], "Gaia DR3 1")).toBe("Azmidi");
    });

    it("preserves the legacy catalog ranking", () => {
        expect(chooseBestName("2MASS J00000000+0000000", ["LHS 12"], "Gaia DR3 1")).toBe("LHS 12");
    });
});
