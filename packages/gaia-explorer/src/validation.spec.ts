import { describe, expect, it } from "vitest";

import { validateDataset } from "./validation";

describe("dataset validation", () => {
    it("accepts a complete generated dataset", () => {
        expect(
            validateDataset({
                metadata: { generated_utc: "2020-01-01T00:00:00.000Z" },
                cubes: {
                    "0:0:0": {
                        index: [0, 0, 0],
                        origin: [0, 0, 0],
                        stars: [
                            {
                                name: "Barnard's Star",
                                relative_position: [0.5, 0.5, 0.5],
                                temperature: 3200,
                                nature: "main-sequence",
                            },
                        ],
                    },
                },
            }).success,
        ).toBe(true);
    });

    it("reports semantic and structural problems separately", () => {
        const semantic = validateDataset({
            metadata: {},
            cubes: {
                "0:0:0": {
                    index: [0, 0, 0],
                    origin: [0, 0, 0],
                    stars: [{ name: "Unknown", relative_position: [0, 0, 0], temperature: null, nature: null }],
                },
            },
        });
        expect(semantic.schemaIssues).toEqual([]);
        expect(semantic.issues).toEqual([
            "Missing nature for Unknown in cube 0:0:0",
            "Missing temperature for Unknown in cube 0:0:0",
            "Missing metadata block",
        ]);
        expect(validateDataset({ metadata: {}, cubes: [] }).schemaIssues.length).toBeGreaterThan(0);
    });
});
