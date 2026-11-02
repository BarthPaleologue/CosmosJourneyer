//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";

import { createScatterPointBuffer } from "./createScatterPointBuffer";

describe("createScatterPointBuffer", () => {
    it("does not scatter on coarse chunks", () => {
        expect(createScatterPointBuffer(new Float32Array(12), new Float32Array(12), 2, 2)).toHaveLength(0);
    });

    it("samples GPU terrain cells and normalizes interpolated normals", () => {
        const points = createScatterPointBuffer(
            new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]),
            new Float32Array([0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 2]),
            2,
            1,
            () => 0.5,
        );

        expect(points).toHaveLength(4 * 6);
        expect([...points.slice(0, 6)]).toEqual([0.25, 0.25, 0, 0, 0, 1]);
        expect([...points.slice(18, 24)]).toEqual([0.75, 0.75, 0, 0, 0, 1]);
    });
});
