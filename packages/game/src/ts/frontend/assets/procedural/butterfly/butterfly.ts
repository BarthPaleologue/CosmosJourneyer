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

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { type Scene } from "@babylonjs/core/scene";

export function createButterfly(scene: Scene) {
    const positions = new Float32Array(6 * 3);
    const indices = new Uint32Array(4 * 3);
    const uvs = new Float32Array(6 * 2);

    // butter fly is made of 4 triangles (2 squares touching each other)
    // 0--1
    // | /|
    // |/ |
    // 2--3
    positions[0] = 0;
    positions[1] = 0;
    positions[2] = -1;

    positions[3] = 1;
    positions[4] = 0;
    positions[5] = -1;

    positions[6] = 0;
    positions[7] = 0.0;
    positions[8] = 0.0;

    positions[9] = 1;
    positions[10] = 0;
    positions[11] = 0;

    positions[12] = 0;
    positions[13] = 0;
    positions[14] = 1;

    positions[15] = 1;
    positions[16] = 0;
    positions[17] = 1;

    // first square
    indices[0] = 0;
    indices[1] = 1;
    indices[2] = 2;

    indices[3] = 1;
    indices[4] = 3;
    indices[5] = 2;

    // second square
    indices[6] = 2;
    indices[7] = 3;
    indices[8] = 4;

    indices[9] = 3;
    indices[10] = 5;
    indices[11] = 4;

    // uvs (0,0) is bottom left, (1,1) is top right
    uvs[0] = 0;
    uvs[1] = 0;

    uvs[2] = 0;
    uvs[3] = 1;

    uvs[4] = 0.5;
    uvs[5] = 0;

    uvs[6] = 0.5;
    uvs[7] = 1;

    uvs[8] = 1;
    uvs[9] = 0;

    uvs[10] = 1;
    uvs[11] = 1;

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.uvs = uvs;

    const mesh = new Mesh("butterfly", scene);
    vertexData.applyToMesh(mesh);
    mesh.createNormals(false);

    mesh.scaling.scaleInPlace(0.5);
    mesh.bakeCurrentTransformIntoVertices();

    return mesh;
}
