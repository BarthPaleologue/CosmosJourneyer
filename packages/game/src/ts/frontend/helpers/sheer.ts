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

import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

export function sheerAlongY(mesh: Mesh, amountY: number) {
    // 1. get positions
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind, true);
    if (positions === null) {
        console.warn("sheerAlongY: mesh has no position data");
        return;
    }

    // 2. find min/max Z (control axis)
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i < positions.length; i += 3) {
        const z = positions[i + 2];
        if (z === undefined) {
            console.warn("sheerAlongY: undefined Z coordinate");
            continue;
        }

        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
    }
    const height = maxZ - minZ;
    if (height === 0) {
        return;
    }

    // 3. shear in Y as a function of Z
    for (let i = 0; i < positions.length; i += 3) {
        const z = positions[i + 2];
        if (z === undefined) {
            console.warn("sheerAlongY: undefined Z coordinate");
            continue;
        }
        const t = (z - minZ) / height; // 0 at min Z, 1 at max Z
        const y = positions[i + 1];
        if (y === undefined) {
            console.warn("sheerAlongY: undefined Y coordinate");
            continue;
        }
        positions[i + 1] = y + amountY * t; // Y coordinate
    }

    // 4. write back
    mesh.updateVerticesData(VertexBuffer.PositionKind, positions);
    mesh.refreshBoundingInfo();

    // 5. recompute normals for correct lighting
    const indices = mesh.getIndices();
    const normals = mesh.getVerticesData(VertexBuffer.NormalKind, true);
    VertexData.ComputeNormals(positions, indices, normals);
    if (normals !== null) {
        mesh.updateVerticesData(VertexBuffer.NormalKind, normals);
    }
}
