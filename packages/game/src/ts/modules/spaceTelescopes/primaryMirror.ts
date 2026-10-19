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

import type { Material } from "@babylonjs/core/Materials/material";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";

import type { Transformable } from "@/frontend/universe/architecture/transformable";

import type { PrimaryMirrorModel } from "./spaceTelescopeModel";

export type MirrorSegment = {
    readonly position: Vector3;
    readonly rotation: Quaternion;
};

export class TelescopePrimaryMirror implements Transformable {
    private readonly mesh: Mesh;
    readonly segments: DeepReadonly<ReadonlyArray<MirrorSegment>>;

    constructor(model: DeepReadonly<PrimaryMirrorModel>, material: Material, scene: Scene) {
        this.segments = createPrimaryMirrorSegments(model);
        this.mesh = CreateCylinder(
            "primaryMirror",
            {
                diameter: 2 * model.segmentation.tileRadius,
                height: 0.01,
                tessellation: 6,
            },
            scene,
        );
        this.mesh.material = material;
        const matrices = new Float32Array(this.segments.length * 16);
        for (const [index, segment] of this.segments.entries()) {
            Matrix.Compose(Vector3.OneReadOnly, segment.rotation, segment.position).copyToArray(matrices, index * 16);
        }
        this.mesh.thinInstanceSetBuffer("matrix", matrices, 16, true);
        this.mesh.thinInstanceRefreshBoundingInfo();
    }

    getTransform(): Mesh {
        return this.mesh;
    }

    dispose(): void {
        this.mesh.dispose();
    }
}

/** Preserve the prototype's axial hexagonal grid, central opening and circular edge selection. */
export function createPrimaryMirrorSegments(model: DeepReadonly<PrimaryMirrorModel>): ReadonlyArray<MirrorSegment> {
    const { tileRadius, gap } = model.segmentation;
    const flat = Math.sqrt(3) * tileRadius;
    const spacingScale = (flat + gap) / flat;
    const axialLimit = Math.ceil((model.apertureRadius + tileRadius) / (tileRadius * 1.5 * spacingScale));
    const segments: MirrorSegment[] = [];
    for (let q = -axialLimit; q <= axialLimit; q++) {
        for (let r = Math.max(-axialLimit, -q - axialLimit); r <= Math.min(axialLimit, -q + axialLimit); r++) {
            if (q === 0 && r === 0) {
                continue;
            }
            const x = tileRadius * 1.5 * q * spacingScale;
            const z = tileRadius * Math.sqrt(3) * (r + q / 2) * spacingScale;
            if (!isSegmentSelected(x, z, tileRadius, model.apertureRadius)) {
                continue;
            }
            const sample = sampleConic(x, z, model.shape.focalLength, model.shape.conicConstant);
            const rotation = Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly, sample.normal, Quaternion.Identity());
            segments.push({ position: new Vector3(x, sample.height, z), rotation });
        }
    }
    return segments;
}

function isSegmentSelected(x: number, z: number, tileRadius: number, apertureRadius: number): boolean {
    if (x * x + z * z <= apertureRadius ** 2) {
        return true;
    }
    for (let k = 0; k < 6; k++) {
        const angle = (k * Math.PI) / 3;
        if ((x + tileRadius * Math.cos(angle)) ** 2 + (z + tileRadius * Math.sin(angle)) ** 2 <= apertureRadius ** 2) {
            return true;
        }
    }
    return false;
}

/** Conic sag and local normal, with a vertex curvature radius of 2f. */
export function sampleConic(
    x: number,
    z: number,
    focalLength: number,
    conicConstant: number,
): { height: number; normal: Vector3 } {
    const radius = 2 * focalLength;
    const radialSquared = x * x + z * z;
    const discriminant = 1 - ((1 + conicConstant) * radialSquared) / (radius * radius);
    const root = Math.sqrt(discriminant);
    const height = radialSquared / (radius * (1 + root));
    const normal = new Vector3(-x / (radius * root), 1, -z / (radius * root)).normalize();
    return { height, normal };
}
