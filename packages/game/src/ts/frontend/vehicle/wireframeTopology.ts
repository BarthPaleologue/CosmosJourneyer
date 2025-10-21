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

import { err, ok, type Result } from "@/utils/types";

type VertexHandle = number;

/**
 * A procedural geometry helper that allows building a wireframe topology vertex by vertex,
 * and connect them with edges without having to worry about vertex indices.
 */
export class WireframeTopology {
    private nextVertexId = 0;
    private readonly vertices: Map<VertexHandle, [number, number, number]> = new Map();
    private readonly edges: Map<string, [VertexHandle, VertexHandle]> = new Map();

    /**
     * Adds a new vertex to the topology.
     * @returns A handle to the newly created vertex you can use to connect edges.
     */
    addVertex(x: number, y: number, z: number): VertexHandle {
        const id = this.nextVertexId++;
        this.vertices.set(id, [x, y, z]);
        return id;
    }

    /**
     * Connects two vertices in the topology.
     * @param vertexA The handle to the first vertex to connect.
     * @param vertexB The handle to the second vertex to connect.
     */
    connect(vertexA: VertexHandle, vertexB: VertexHandle) {
        const a = Math.min(vertexA, vertexB);
        const b = Math.max(vertexA, vertexB);
        this.edges.set(this.getEdgeKey(a, b), [a, b]);
    }

    private getEdgeKey(a: VertexHandle, b: VertexHandle): string {
        return a < b ? `${a}_${b}` : `${b}_${a}`;
    }

    private buildIndexMap(): Map<VertexHandle, number> {
        const indexOf = new Map<VertexHandle, number>();
        let i = 0;
        for (const id of this.vertices.keys()) {
            indexOf.set(id, i++);
        }
        return indexOf;
    }

    private getIndex(indexOf: Map<VertexHandle, number>, key: VertexHandle): Result<number, string> {
        const i = indexOf.get(key);
        if (i === undefined) return err(`Missing index for vertex ${key}`);
        return ok(i);
    }

    /**
     * @returns A buffer containing the positions of all vertices (strided by 3).
     */
    getPositionsBuffer(): Result<Float32Array, string> {
        const indexOf = this.buildIndexMap();
        const arr = new Float32Array(this.vertices.size * 3);
        for (const [id, pos] of this.vertices.entries()) {
            const i = this.getIndex(indexOf, id);
            if (!i.success) {
                return i;
            }

            const base = 3 * i.value;
            arr[base] = pos[0];
            arr[base + 1] = pos[1];
            arr[base + 2] = pos[2];
        }

        return ok(arr);
    }

    /**
     * @returns A buffer containing the indices of all edges (strided by 2).
     */
    getEdgeIndices(): Result<Uint32Array, string> {
        const indexOf = this.buildIndexMap();
        const arr = new Uint32Array(this.edges.size * 2);
        let i = 0;
        for (const [u, v] of this.edges.values()) {
            const indexU = this.getIndex(indexOf, u);
            if (!indexU.success) {
                return indexU;
            }

            const indexV = this.getIndex(indexOf, v);
            if (!indexV.success) {
                return indexV;
            }

            arr[i++] = indexU.value;
            arr[i++] = indexV.value;
        }

        return ok(arr);
    }

    /**
     * @returns A buffer containing the indices of all triangles formed by the edges (strided by 3).
     */
    getTriangleIndices(): Result<Uint32Array, string> {
        const indexOf = this.buildIndexMap();

        const adj = new Map<VertexHandle, Set<VertexHandle>>();
        for (const [a, b] of this.edges.values()) {
            const setA = adj.get(a) ?? new Set<VertexHandle>();
            const setB = adj.get(b) ?? new Set<VertexHandle>();
            setA.add(b);
            setB.add(a);

            if (!adj.has(a)) adj.set(a, setA);
            if (!adj.has(b)) adj.set(b, setB);
        }

        const triangles: number[] = [];
        for (const [u, nu] of adj) {
            for (const v of nu) {
                if (v <= u) continue;
                const nv = adj.get(v);
                if (!nv) return err(`Adjacency missing for vertex ${v}`);
                for (const w of nv) {
                    if (w <= v) continue;
                    if (nu.has(w)) {
                        const indexU = this.getIndex(indexOf, u);
                        if (!indexU.success) {
                            return indexU;
                        }

                        const indexV = this.getIndex(indexOf, v);
                        if (!indexV.success) {
                            return indexV;
                        }

                        const indexW = this.getIndex(indexOf, w);
                        if (!indexW.success) {
                            return indexW;
                        }

                        triangles.push(indexU.value, indexV.value, indexW.value);
                    }
                }
            }
        }

        return ok(new Uint32Array(triangles));
    }
}
