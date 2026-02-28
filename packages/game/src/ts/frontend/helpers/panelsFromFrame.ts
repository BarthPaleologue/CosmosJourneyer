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

import { Matrix, Quaternion, Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PolygonMeshBuilder } from "@babylonjs/core/Meshes/polygonMesh";
import type { Scene } from "@babylonjs/core/scene";
import earcut from "earcut";

/**
 * Build solid panels by detecting planar face loops from an edge-only frame.
 *
 * Big picture:
 * 1) Construct undirected vertex adjacency from the edge list.
 * 2) For each vertex, sort its neighbors in a consistent circular order by
 *    projecting local neighbor directions into a stable tangent frame that
 *    uses the mesh centroid as an outward guess. This gives a clockwise
 *    ordering around each vertex.
 * 3) Trace faces via “right-hand” walks on directed edges:
 *    starting from every directed edge (u→v), always turn to the predecessor
 *    neighbor of u in v’s circular order. Each closed walk yields a candidate
 *    face loop.
 * 4) Normalize and deduplicate loops by canonical rotation and direction.
 * 5) For each unique loop, test planarity. If the vertices are co-planar
 *    within a small epsilon, project the loop to 2D in that plane, triangulate
 *    with `PolygonMeshBuilder`, then extrude by `thickness`.
 * 6) Merge all panel meshes into a single mesh.
 *
 * Assumptions and limits:
 * - `positions` is a flat array of xyz triples. Indices in `edges` reference these triples.
 * - The graph can be non-manifold. The walk may produce both interior and exterior loops.
 * - Only near-planar loops are kept (planarity epsilon controls this).
 * - Face orientation is inferred from the right-turn rule relative to the local ordering.
 *
 * @param name       Mesh name for the merged panels.
 * @param positions  Flat xyz positions array (length % 3 === 0).
 * @param edges      Pairs of vertex indices [u0,v0,u1,v1,...] describing undirected edges.
 * @param thickness  Extrusion thickness along the face normal.
 * @param scene      js scene.
 * @returns          Merged panel mesh or null if no valid panels were found.
 * @see https://playground.babylonjs.com/#8B4798#4
 */
export function createPanelsFromFrame(
    name: string,
    positions: Float32Array,
    edges: Uint32Array,
    thickness: number,
    scene: Scene,
): Mesh | null {
    const vertexCount = positions.length / 3;
    const getVec3 = (i: number) => new Vector3(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2]);

    // Undirected adjacency
    const adjacency: Array<Set<number>> = Array.from({ length: vertexCount }, () => new Set<number>());
    for (let i = 0; i < edges.length; i += 2) {
        const a = edges[i];
        const b = edges[i + 1];
        if (a === undefined || b === undefined) {
            continue;
        }
        adjacency[a]?.add(b);
        adjacency[b]?.add(a);
    }

    // Centroid for outward direction guess
    let cx = 0,
        cy = 0,
        cz = 0;
    for (let i = 0; i < vertexCount; i++) {
        cx += positions[3 * i] ?? 0;
        cy += positions[3 * i + 1] ?? 0;
        cz += positions[3 * i + 2] ?? 0;
    }
    const centroid = new Vector3(cx / vertexCount, cy / vertexCount, cz / vertexCount);

    // Angle-sorted neighbor ordering per vertex
    const clockwiseNeighbors = Array.from({ length: vertexCount }, () => new Array<number>());
    const neighborToIndex = Array.from({ length: vertexCount }, () => new Map<number, number>());

    for (let v = 0; v < vertexCount; v++) {
        const pv = getVec3(v);
        const outward = pv.subtract(centroid).normalize();

        // Seed a tangent from any non-degenerate neighbor direction
        let tangent: Vector3 | null = null;
        for (const w of adjacency[v] ?? []) {
            const dir = getVec3(w).subtract(pv);
            if (dir.lengthSquared() > 1e-10) {
                tangent = dir.normalize();
                break;
            }
        }
        if (!tangent) {
            clockwiseNeighbors[v] = [];
            continue;
        }

        // Build a stable local frame (outward, tangent, binormal)
        let binormal = Vector3.Cross(outward, tangent);
        if (binormal.lengthSquared() < 1e-10) {
            binormal = Vector3.Cross(outward, Math.abs(outward.x) < 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0));
        }
        binormal.normalize();
        const tangentOrtho = Vector3.Cross(binormal, outward).normalize();

        // Sort neighbors by angle in the local plane
        const ordered = Array.from(adjacency[v] ?? [])
            .map((w) => {
                const dv = getVec3(w).subtract(pv);
                const x = Vector3.Dot(dv, tangentOrtho);
                const y = Vector3.Dot(dv, binormal);
                return { w, ang: Math.atan2(y, x) };
            })
            .sort((a, b) => a.ang - b.ang)
            .map((o) => o.w);

        clockwiseNeighbors[v] = ordered;
        ordered.forEach((w, idx) => neighborToIndex[v]?.set(w, idx));
    }

    // Face tracing by rightmost turns
    const directedEdgeKey = (u: number, v: number) => `${u}>${v}`;
    const visitedDirected = new Set<string>();
    const candidateLoops: number[][] = [];
    const maxSteps = 4 * edges.length;

    for (let i = 0; i < edges.length; i += 2) {
        const a = edges[i];
        const b = edges[i + 1];
        if (a === undefined || b === undefined) {
            continue;
        }

        for (const [u0, v0] of [
            [a, b],
            [b, a],
        ] as const) {
            const startKey = directedEdgeKey(u0, v0);
            if (visitedDirected.has(startKey)) continue;

            const loop: number[] = [u0];
            let u = u0;
            let v = v0;
            let steps = 0;

            while (steps++ < maxSteps) {
                visitedDirected.add(directedEdgeKey(u, v));
                loop.push(v);

                if (v === u0) {
                    // Closed at start vertex
                    candidateLoops.push(loop.slice()); // includes repeated start
                    break;
                }

                const order = clockwiseNeighbors[v];
                if (!order || order.length === 0) break;
                const idx = neighborToIndex[v]?.get(u);
                if (idx === undefined) {
                    break;
                }

                // Rightmost turn: previous neighbor in circular order
                const nextIdx = (idx - 1 + order.length) % order.length;
                const w = order[nextIdx];
                if (w === undefined) {
                    break;
                }

                if (visitedDirected.has(directedEdgeKey(v, w)) && w !== u0) break;
                u = v;
                v = w;
            }
        }
    }

    // Normalize a loop to a canonical key for deduplication
    function normalizeLoop(loop: number[]): number[] | null {
        let ring = loop;
        if (ring.length >= 2 && ring[0] === ring[ring.length - 1]) ring = ring.slice(0, -1);
        if (ring.length < 3) return null;

        // rotate so the smallest index is first, and choose lexicographically smaller of forward/reverse
        let minI = 0;
        for (let i = 1; i < ring.length; i++) {
            const ringI = ring[i];
            const ringMinI = ring[minI];
            if (ringI === undefined || ringMinI === undefined) {
                return null;
            }

            if (ringI < ringMinI) {
                minI = i;
            }
        }
        const rotated = ring.slice(minI).concat(ring.slice(0, minI));
        const reversed = rotated.slice().reverse();

        for (let i = 0; i < rotated.length; i++) {
            const rotatedI = rotated[i];
            const reversedI = reversed[i];
            if (rotatedI === undefined || reversedI === undefined) {
                return null;
            }

            if (rotatedI !== reversedI) {
                return rotatedI < reversedI ? rotated : reversed;
            }
        }
        return rotated;
    }

    // Deduplicate closed loops
    const uniqueLoops = new Map<string, number[]>();
    for (const L of candidateLoops) {
        if (L.length < 4 || L[0] !== L[L.length - 1]) continue; // must be closed
        const ring = L.slice(0, -1);
        const keyArr = normalizeLoop(ring);
        if (!keyArr) continue;
        uniqueLoops.set(keyArr.join(","), keyArr);
    }

    // Build panels
    const PLANARITY_EPS = 1e-2;
    const panels: Mesh[] = [];

    for (const ringIndices of uniqueLoops.values()) {
        const points = ringIndices.map((i) => getVec3(i));

        // Face centroid
        let fx = 0,
            fy = 0,
            fz = 0;
        for (const p of points) {
            fx += p.x;
            fy += p.y;
            fz += p.z;
        }
        const faceCentroid = new Vector3(fx / points.length, fy / points.length, fz / points.length);

        // Newell-like polygon normal
        const normal = new Vector3(0, 0, 0);
        for (let i = 0; i < points.length; i++) {
            const p0 = points[i];
            const p1 = points[(i + 1) % points.length];
            if (p0 === undefined || p1 === undefined) {
                continue;
            }
            normal.x += (p0.y - p1.y) * (p0.z + p1.z);
            normal.y += (p0.z - p1.z) * (p0.x + p1.x);
            normal.z += (p0.x - p1.x) * (p0.y + p1.y);
        }
        if (normal.lengthSquared() < 1e-12) {
            continue;
        }
        normal.normalize();

        // Planarity check
        let maxDistance = 0;
        for (const p of points) {
            const d = Math.abs(Vector3.Dot(p.subtract(faceCentroid), normal));
            if (d > maxDistance) maxDistance = d;
        }
        if (maxDistance > PLANARITY_EPS) {
            continue;
        }

        // Build local 2D basis in the face plane
        const axisU = Vector3.Normalize(
            Vector3.Cross(Math.abs(normal.x) < 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0), normal),
        );
        const axisV = Vector3.Cross(normal, axisU).normalize();

        // Project to 2D
        const shape2D: Vector2[] = points.map((p) => {
            const d = p.subtract(faceCentroid);
            return new Vector2(Vector3.Dot(d, axisU), Vector3.Dot(d, axisV));
        });

        // Triangulate and extrude in 2D, then place back in 3D
        const pmb = new PolygonMeshBuilder("poly", shape2D, scene, earcut);
        const panel = pmb.build(false, thickness);

        // Compose transform to map local 2D back to 3D plane at faceCentroid.
        // Using a quaternion that looks along axisV with up=normal gives a stable frame.
        const rotation = Quaternion.FromLookDirectionRH(axisV, normal.negate());
        const panelTransform = Matrix.Compose(new Vector3(1, 1, 1), rotation, faceCentroid);

        panel.bakeTransformIntoVertices(panelTransform);
        panels.push(panel);
    }

    if (panels.length === 0) return null;

    const merged = Mesh.MergeMeshes(panels, true, true, undefined, false, true);
    if (!merged) return null;
    merged.name = name;
    return merged;
}
