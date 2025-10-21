//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { WireframeTopology } from "./wireframeTopology";

const asTriples = (arr: Uint32Array) =>
    Array.from({ length: Math.floor(arr.length / 3) }, (_, i) => {
        const v1 = arr[3 * i];
        const v2 = arr[3 * i + 1];
        const v3 = arr[3 * i + 2];
        if (v1 === undefined || v2 === undefined || v3 === undefined) {
            throw new Error("Invalid triangle indices");
        }

        return [v1, v2, v3]
            .slice()
            .sort((a, b) => a - b)
            .join(",");
    }).sort();

describe("WireframeTopology", () => {
    it("adds vertices and returns sequential handles", () => {
        const topo = new WireframeTopology();
        const v0 = topo.addVertex(1, 2, 3);
        const v1 = topo.addVertex(4, 5, 6);
        const v2 = topo.addVertex(7, 8, 9);

        expect(v0).toBe(0);
        expect(v1).toBe(1);
        expect(v2).toBe(2);

        const posResult = topo.getPositionsBuffer();
        if (!posResult.success) {
            throw new Error(`Failed to get positions buffer: ${posResult.error}`);
        }

        expect(posResult.value).toEqual(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });

    it("connects undirected edges without duplicates", () => {
        const topo = new WireframeTopology();
        const a = topo.addVertex(0, 0, 0);
        const b = topo.addVertex(1, 0, 0);

        topo.connect(a, b);
        topo.connect(b, a); // same edge, reversed

        const edgesResult = topo.getEdgeIndices();
        if (!edgesResult.success) {
            throw new Error(`Failed to get edge indices: ${edgesResult.error}`);
        }

        const edges = edgesResult.value;
        expect(edges.length).toBe(2); // one edge => 2 indices

        const v1 = edges[0];
        const v2 = edges[1];
        if (v1 === undefined || v2 === undefined) {
            throw new Error("Invalid edge indices");
        }

        const single = [v1, v2].sort((x, y) => x - y);
        expect(single).toEqual([0, 1]);
    });

    it("edge indices follow insertion order of edges (orientation-agnostic)", () => {
        const topo = new WireframeTopology();
        const v0 = topo.addVertex(0, 0, 0);
        const v1 = topo.addVertex(1, 0, 0);
        const v2 = topo.addVertex(0, 1, 0);

        topo.connect(v0, v1);
        topo.connect(v1, v2);
        topo.connect(v2, v0);

        const edgesResult = topo.getEdgeIndices();
        if (!edgesResult.success) {
            throw new Error(`Failed to get edge indices: ${edgesResult.error}`);
        }
        const edges = edgesResult.value;

        const asPairsNormalized = (a: Uint32Array) =>
            Array.from({ length: a.length / 2 }, (_, i) => {
                const v1 = a[2 * i];
                const v2 = a[2 * i + 1];
                if (v1 === undefined || v2 === undefined) {
                    throw new Error("Invalid edge indices");
                }

                const p = [v1, v2];
                p.sort((x, y) => x - y);
                return p;
            });

        // preserves insertion order of edges, ignores direction
        expect(asPairsNormalized(edges)).toEqual([
            [0, 1],
            [1, 2],
            [0, 2],
        ]);
    });

    it("triangle indices for a single triangle", () => {
        const topo = new WireframeTopology();
        const v0 = topo.addVertex(0, 0, 0);
        const v1 = topo.addVertex(1, 0, 0);
        const v2 = topo.addVertex(0, 1, 0);

        topo.connect(v0, v1);
        topo.connect(v1, v2);
        topo.connect(v2, v0);

        const trisResult = topo.getTriangleIndices();
        if (!trisResult.success) {
            throw new Error(`Failed to get triangle indices: ${trisResult.error}`);
        }

        const tris = trisResult.value;
        expect(tris).toEqual(new Uint32Array([0, 1, 2]));
    });

    it("triangle indices for a square with one diagonal", () => {
        const topo = new WireframeTopology();
        const v0 = topo.addVertex(0, 0, 0);
        const v1 = topo.addVertex(1, 0, 0);
        const v2 = topo.addVertex(1, 1, 0);
        const v3 = topo.addVertex(0, 1, 0);

        topo.connect(v0, v1);
        topo.connect(v1, v2);
        topo.connect(v2, v3);
        topo.connect(v3, v0);
        topo.connect(v0, v2); // diagonal

        const trisResult = topo.getTriangleIndices();
        if (!trisResult.success) {
            throw new Error(`Failed to get triangle indices: ${trisResult.error}`);
        }

        const tris = trisResult.value;
        // Order of triangles is not guaranteed; compare as sets of sorted triples.
        expect(asTriples(tris)).toEqual(["0,1,2", "0,2,3"]);
    });

    it("no triangles when edges do not close a cycle of three", () => {
        const topo = new WireframeTopology();
        const v0 = topo.addVertex(0, 0, 0);
        const v1 = topo.addVertex(1, 0, 0);
        const v2 = topo.addVertex(2, 0, 0);

        topo.connect(v0, v1);
        topo.connect(v1, v2);

        const trisResult = topo.getTriangleIndices();
        if (!trisResult.success) {
            throw new Error(`Failed to get triangle indices: ${trisResult.error}`);
        }

        const tris = trisResult.value;
        expect(tris.length).toBe(0);
    });
});
