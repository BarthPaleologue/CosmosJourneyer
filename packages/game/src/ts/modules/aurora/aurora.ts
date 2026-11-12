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

import { Axis } from "@babylonjs/core";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { degreesToRadians } from "@cosmos-journeyer/physics";

import type { SystemContent } from "@/frontend/systemEntity/systemEntity";

import { createAuroraMaterial } from "./auroraMaterial";

export class Aurora implements SystemContent {
    private readonly root: TransformNode;

    constructor(planetRadius: number, scene: Scene) {
        const ribbons = new Mesh("Ribbons", scene);
        ribbons.isUnIndexed = true;
        ribbons.isPickable = false;

        this.root = ribbons;

        const vertexData = createRibbonVertexData();
        vertexData.applyToMesh(ribbons);

        const ribbonMaterial = createAuroraMaterial(scene);
        ribbons.material = ribbonMaterial;

        const ribbonCountNorth = 24;
        const ribbonCountSouth = 24;
        const matrixBuffer = new Float32Array(16 * (ribbonCountNorth + ribbonCountSouth));
        const distanceToCenter = planetRadius + 70e3;

        const colatitudeNorth = degreesToRadians(25);
        const latitudeNorth = Math.PI / 2 - colatitudeNorth;
        createRibbonMatrixBuffer(ribbonCountNorth, latitudeNorth, distanceToCenter, matrixBuffer, 0);

        const colatitudeSouth = degreesToRadians(25);
        const latitudeSouth = -Math.PI / 2 + colatitudeSouth;
        createRibbonMatrixBuffer(
            ribbonCountSouth,
            latitudeSouth,
            distanceToCenter,
            matrixBuffer,
            ribbonCountNorth * 16,
        );

        ribbons.thinInstanceSetBuffer("matrix", matrixBuffer);
    }

    dispose() {
        this.root.dispose();
    }

    getTransform() {
        return this.root;
    }
}

function createRibbonMatrixBuffer(
    ribbonCount: number,
    latitude: number,
    distanceToCenter: number,
    target: Float32Array,
    offset: number,
) {
    const localUp = Vector3.Zero();
    const localUpRotation = Quaternion.Identity();
    const position = Vector3.Zero();
    const rotation = Quaternion.Identity();
    const matrix = Matrix.Identity();
    for (let i = 0; i < ribbonCount; i++) {
        const longitude = (2 * Math.PI * i) / ribbonCount + Math.random();

        geographicToCartesianToRef(latitude, longitude, localUp);

        localUp.scaleToRef(distanceToCenter, position);

        Quaternion.RotationAxisToRef(Axis.Y, -longitude + Math.PI / 2, rotation);
        Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly, localUp, localUpRotation);

        localUpRotation.multiplyToRef(rotation, rotation);

        Matrix.ComposeToRef(Vector3.OneReadOnly, rotation, position, matrix).copyToArray(target, offset + i * 16);
    }
}

/**
 * @returns Aurora ribbon geometry in meters.
 */
function createRibbonVertexData(): VertexData {
    const rowVertexCount = 64;
    const ribbonPositions = new Float32Array(rowVertexCount * 2 * 3);

    for (let i = 0; i < rowVertexCount; i++) {
        for (let j = 0; j < 2; j++) {
            const isTopVertex = j === 0;
            const x = i / (rowVertexCount - 1) - 0.5;
            const y = isTopVertex ? 1 : 0;
            const z = 0;

            const vertexIndex = 2 * i + j;

            ribbonPositions[vertexIndex * 3 + 0] = x;
            ribbonPositions[vertexIndex * 3 + 1] = y;
            ribbonPositions[vertexIndex * 3 + 2] = z;
        }
    }

    const vertexData = new VertexData();
    vertexData.positions = ribbonPositions;

    return vertexData;
}

function geographicToCartesianToRef(latitude: number, longitude: number, ref: Vector3) {
    const cosLatitude = Math.cos(latitude);
    ref.set(cosLatitude * Math.cos(longitude), Math.sin(latitude), cosLatitude * Math.sin(longitude));
}
