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
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { type Scene } from "@babylonjs/core/scene";

// rotation using https://www.wikiwand.com/en/Rodrigues%27_rotation_formula
function rotateAround(vector: Vector3, axis: Vector3, theta: number) {
    // Please note that unit vector are required, i did not divide by the norms
    return vector
        .scale(Math.cos(theta))
        .addInPlace(Vector3.Cross(axis, vector).scaleInPlace(Math.sin(theta)))
        .addInPlace(axis.scale(Vector3.Dot(axis, vector) * (1.0 - Math.cos(theta))));
}

export function createGrassBlade(scene: Scene, nbStacks: number) {
    const nbVertices = 2 * nbStacks + 1;
    const nbTriangles = 2 * (nbStacks - 1) + 1;

    const positions = new Float32Array(nbVertices * 3);
    const normals = new Float32Array(nbVertices * 3);
    const indices = new Uint32Array(nbTriangles * 3);

    const normal = new Vector3(0, 0, 1);
    const curvyNormal1 = rotateAround(normal, new Vector3(0, 1, 0), Math.PI * 0.3);
    const curvyNormal2 = rotateAround(normal, new Vector3(0, 1, 0), -Math.PI * 0.3);

    const width = 0.07;
    const height = 0.8;

    // The vertices are aranged in rows of 2 vertices, we stack the rows on top of each other until we reach the top of the blade
    let vertexIndex = 0;
    let normalIndex = 0;
    let indexIndex = 0;
    const step = height / nbStacks;
    for (let i = 0; i < nbStacks; i++) {
        // the square root makes the blade rounder
        const x = width * Math.sqrt((nbStacks - i) * step);

        positions[vertexIndex++] = -x;
        positions[vertexIndex++] = i * step;
        positions[vertexIndex++] = 0;

        positions[vertexIndex++] = x;
        positions[vertexIndex++] = i * step;
        positions[vertexIndex++] = 0;

        normals[normalIndex++] = curvyNormal1.x;
        normals[normalIndex++] = curvyNormal1.y;
        normals[normalIndex++] = curvyNormal1.z;

        normals[normalIndex++] = curvyNormal2.x;
        normals[normalIndex++] = curvyNormal2.y;
        normals[normalIndex++] = curvyNormal2.z;

        if (i === 0) {
            continue;
        }

        // make 2 triangles out of the vertices
        indices[indexIndex++] = 2 * (i - 1);
        indices[indexIndex++] = 2 * (i - 1) + 1;
        indices[indexIndex++] = 2 * i;

        indices[indexIndex++] = 2 * i;
        indices[indexIndex++] = 2 * (i - 1) + 1;
        indices[indexIndex++] = 2 * i + 1;
    }

    // the last vertex is the tip of the blade
    positions[vertexIndex++] = 0;
    positions[vertexIndex++] = nbStacks * step;
    positions[vertexIndex++] = 0;

    normals[normalIndex++] = 0;
    normals[normalIndex++] = 0;
    normals[normalIndex++] = 1;

    // last triangle
    indices[indexIndex++] = 2 * (nbStacks - 1);
    indices[indexIndex++] = 2 * (nbStacks - 1) + 1;
    indices[indexIndex++] = 2 * nbStacks;

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.indices = indices;

    const grassBlade = new Mesh("grassBlade", scene);
    vertexData.applyToMesh(grassBlade);

    return grassBlade;
}
