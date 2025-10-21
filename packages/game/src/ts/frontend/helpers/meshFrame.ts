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

export function createEdgeTubeFrame(
    name: string,
    positions: Float32Array,
    edges: Uint32Array,
    radius: number,
    scene: Scene,
) {
    const edgeKey = (a: number, b: number) => (a < b ? `${a}_${b}` : `${b}_${a}`);
    const seen = new Set<string>();
    const tubes: Array<Mesh> = [];
    const tessellation = 12;
    const overlap = 0;

    const getVec = (i: number) => new Vector3(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2]);

    const usedVerts = new Set<number>();

    for (let i = 0; i < edges.length; i += 2) {
        const a = edges[i];
        const b = edges[i + 1];
        if (a === undefined || b === undefined) continue;

        const k = edgeKey(a, b);
        if (seen.has(k)) continue;
        seen.add(k);

        usedVerts.add(a);
        usedVerts.add(b);

        const p1 = getVec(a);
        const p2 = getVec(b);
        const dir = p2.subtract(p1).normalize();

        const q1 = p1.subtract(dir.scale(overlap));
        const q2 = p2.add(dir.scale(overlap));

        const tube = MeshBuilder.CreateTube(
            `e_${k}`,
            { path: [q1, q2], radius, tessellation, updatable: false },
            scene,
        );
        tubes.push(tube);
    }

    for (const vi of usedVerts) {
        const x = positions[3 * vi];
        const y = positions[3 * vi + 1];
        const z = positions[3 * vi + 2];
        if (x === undefined || y === undefined || z === undefined) continue;
        const joint = MeshBuilder.CreateSphere(`j_${vi}`, { diameter: radius * 2, segments: 12 }, scene);
        joint.position.set(x, y, z);
        tubes.push(joint);
    }

    const merged = Mesh.MergeMeshes(tubes, true, true, undefined, false, true);
    if (!merged) return null;
    merged.name = name;
    return merged;
}
