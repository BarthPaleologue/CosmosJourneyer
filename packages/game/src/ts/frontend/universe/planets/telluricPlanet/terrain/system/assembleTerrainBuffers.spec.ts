//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";

import { assembleTerrainBuffers } from "./assembleTerrainBuffers";

describe("assembleTerrainBuffers", () => {
    it("unpacks GPU vec4 values and builds the canonical grid indices", () => {
        const buffers = assembleTerrainBuffers(
            new Float32Array([0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1]),
            new Float32Array([0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]),
            2,
            1024,
            [0, 0, 10],
            () => ({}),
        );

        expect([...buffers.positions]).toEqual([0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0]);
        expect([...buffers.normals]).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
        expect([...buffers.indices]).toEqual([2, 3, 0, 3, 1, 0]);
        expect(buffers.scatteredInstances).toEqual({});
    });

    it("adds a lowered skirt when vertices are close enough", () => {
        const buffers = assembleTerrainBuffers(
            new Float32Array([0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1]),
            new Float32Array(16),
            2,
            100,
            [0, 0, 1000],
            () => ({}),
        );

        expect(buffers.positions).toHaveLength((4 + 8) * 3);
        expect(buffers.indices).toHaveLength(6 + 4 * 6);
        expect(buffers.positions[4 * 3 + 2]).toBeLessThan(0);
    });
});
