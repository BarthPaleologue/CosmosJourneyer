//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024-2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import "@babylonjs/core/Meshes/thinInstanceMesh";

import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";

import type { PrimaryMirrorModel } from "./spaceTelescopeModel";

/** The vertex curvature radius is 2f. Reject the rim where the normal becomes singular. */
export function sampleConic(
    x: number,
    z: number,
    focalLength: number,
    conicConstant: number,
): { height: number; normal: Vector3 } | undefined {
    if (![x, z, focalLength, conicConstant].every(Number.isFinite) || focalLength <= 0) {
        return undefined;
    }
    const radius = 2 * focalLength;
    const radialSquared = x * x + z * z;
    const discriminant = 1 - ((1 + conicConstant) * radialSquared) / (radius * radius);
    if (discriminant <= 0 || !Number.isFinite(discriminant)) {
        return undefined;
    }
    const root = Math.sqrt(discriminant);
    const height = radialSquared / (radius * (1 + root));
    const normal = new Vector3(-x / (radius * root), 1, -z / (radius * root)).normalize();
    return { height, normal };
}

/** Preserve the prototype's axial hexagonal grid, central opening and circular edge selection. */
export function createPrimaryMirrorMatrices(model: DeepReadonly<PrimaryMirrorModel>): Float32Array {
    const { tileRadius, gap } = model.segmentation;
    const flat = Math.sqrt(3) * tileRadius;
    const spacingScale = (flat + gap) / flat;
    const ringCount = Math.floor(model.apertureRadius / flat);
    const matrices: number[] = [];
    for (let q = -ringCount; q <= ringCount; q++) {
        for (let r = Math.max(-ringCount, -q - ringCount); r <= Math.min(ringCount, -q + ringCount); r++) {
            if (q === 0 && r === 0) {
                continue;
            }
            const x = tileRadius * 1.5 * q * spacingScale;
            const z = tileRadius * Math.sqrt(3) * (r + q / 2) * spacingScale;
            let inside = x * x + z * z <= model.apertureRadius ** 2;
            for (let k = 0; k < 6 && !inside; k++) {
                const angle = (k * Math.PI) / 3;
                inside =
                    (x + tileRadius * Math.cos(angle)) ** 2 + (z + tileRadius * Math.sin(angle)) ** 2 <=
                    model.apertureRadius ** 2;
            }
            if (!inside) {
                continue;
            }
            const sample = sampleConic(x, z, model.shape.focalLength, model.shape.conicConstant);
            if (sample === undefined) {
                continue;
            }
            const rotation = Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly, sample.normal, Quaternion.Identity());
            matrices.push(...Matrix.Compose(Vector3.One(), rotation, new Vector3(x, sample.height, z)).asArray());
        }
    }
    return new Float32Array(matrices);
}

export function createPrimaryMirror(model: DeepReadonly<PrimaryMirrorModel>, scene: Scene) {
    const mesh = CreateCylinder(
        "primaryMirror",
        {
            diameter: 2 * model.segmentation.tileRadius,
            height: 0.01,
            tessellation: 6,
        },
        scene,
    );
    mesh.thinInstanceSetBuffer("matrix", createPrimaryMirrorMatrices(model), 16, true);
    mesh.thinInstanceRefreshBoundingInfo();
    return mesh;
}
