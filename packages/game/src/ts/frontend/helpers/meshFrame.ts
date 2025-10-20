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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";

export function createMeshFrame(
    name: string,
    positions: Float32Array,
    indices: Uint32Array,
    radius: number,
    excludedEdges: ReadonlyArray<[number, number]>,
    scene: Scene,
) {
    const edgeKey = (a: number, b: number) => (a < b ? `${a}_${b}` : `${b}_${a}`);
    const seen = new Set<string>();
    const tubes: Mesh[] = [];
    const tessel = 12;
    const overlap = radius * 0;

    // normalize excluded list to a Set of keys
    const excluded = new Set<string>(excludedEdges.map(([i, j]) => edgeKey(i, j)));

    const getVec = (i: number) => new Vector3(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2]);

    const usedVerts = new Set(indices);

    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i],
            b = indices[i + 1],
            c = indices[i + 2];
        if (a === undefined || b === undefined || c === undefined) continue;

        const edges: [[number, number], [number, number], [number, number]] = [
            [a, b],
            [b, c],
            [c, a],
        ];

        for (const [i1, i2] of edges) {
            const k = edgeKey(i1, i2);
            if (seen.has(k)) {
                continue;
            }
            seen.add(k);

            if (excluded.has(k)) {
                continue;
            }

            const p1 = getVec(i1);
            const p2 = getVec(i2);
            const dir = p2.subtract(p1).normalize();

            const q1 = p1.subtract(dir.scale(overlap));
            const q2 = p2.add(dir.scale(overlap));

            const tube = MeshBuilder.CreateTube(
                `e_${k}`,
                { path: [q1, q2], radius, tessellation: tessel, updatable: false },
                scene,
            );
            tubes.push(tube);
        }
    }

    for (const vi of usedVerts) {
        const joint = MeshBuilder.CreateSphere(`j_${vi}`, { diameter: radius * 2, segments: 12 }, scene);
        const x = positions[3 * vi];
        const y = positions[3 * vi + 1];
        const z = positions[3 * vi + 2];
        if (x === undefined || y === undefined || z === undefined) continue;
        joint.position.set(x, y, z);
        tubes.push(joint);
    }

    const merged = Mesh.MergeMeshes(tubes, true, true, undefined, false, true);
    if (merged === null) return null;

    merged.name = name;
    return merged;
}
