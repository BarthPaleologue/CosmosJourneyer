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

import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

import type { PrimaryMirrorModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/spaceTelescope/primaryMirror";

import { setUpVector } from "@/frontend/uberCore/transforms/basicTransform";
import type { Transformable } from "@/frontend/universe/architecture/transformable";

import type { DeepReadonly } from "@/utils/types";

export class PrimaryMirror implements Transformable {
    readonly model: DeepReadonly<PrimaryMirrorModel>;

    private readonly transform: TransformNode;

    constructor(model: DeepReadonly<PrimaryMirrorModel>, receptorRadius: number, scene: Scene) {
        this.model = model;
        this.transform = new TransformNode("PrimaryMirrorTransform", scene);

        function parabola(x: number, z: number, focalLength: number): number {
            return (x * x + z * z) / (4 * focalLength);
        }

        function parabolaNormal(x: number, z: number, focalLength: number): Vector3 {
            const dx = x / (2 * focalLength);
            const dz = z / (2 * focalLength);
            const normal = Vector3.Up();
            return normal.subtractFromFloatsToRef(dx, 0, dz, normal).normalize();
        }

        const mirrorMaterial = new PBRMetallicRoughnessMaterial("mirrorMaterial", scene);
        mirrorMaterial.metallic = 1.0;
        mirrorMaterial.roughness = 0.02;
        mirrorMaterial.baseColor = new Color3(1, 0.7766, 0.3362); // gold-like

        const hexRadius = 0.28; // circumradius (same as before)

        const hexHeight = 0.01;

        // GAP control:
        //  - 0.00 = tight touching (no visual gap)
        //  - 0.005 ≈ realistic JWST-ish tiny gap (~0.5%)
        //  - 0.05..0.15 = visible separation for visualization
        const gapFraction = model.segmentation.gap / model.segmentation.tileRadius; // change this to tune spacing (8% here gives a clear visible gap)

        const spacingScale = 1 + gapFraction;

        const horiz = 1.5 * hexRadius * spacingScale; // center-to-center horizontal spacing
        const vert = Math.sqrt(3) * hexRadius * spacingScale; // center-to-center vertical spacing

        const qMax = Math.ceil(model.apertureRadius / horiz) + 1;
        const rMax = Math.ceil(model.apertureRadius / vert) + 1;

        for (let q = -qMax; q <= qMax; q++) {
            for (let r = -rMax; r <= rMax; r++) {
                const xPos = hexRadius * 1.5 * q * spacingScale;
                const zPos = hexRadius * Math.sqrt(3) * (r + q / 2) * spacingScale;

                if (xPos * xPos + zPos * zPos < receptorRadius ** 2) continue;

                if (xPos * xPos + zPos * zPos > (model.apertureRadius + hexRadius) ** 2) continue;

                const y = parabola(xPos, zPos, model.shape.focalLength);

                const dot = MeshBuilder.CreateCylinder(
                    "hexTile",
                    { diameter: 2 * hexRadius, height: hexHeight, tessellation: 6 },
                    scene,
                );
                dot.position.set(xPos, y, zPos);
                dot.material = mirrorMaterial;
                dot.parent = this.getTransform();

                const normal = parabolaNormal(xPos, zPos, model.shape.focalLength);
                setUpVector(dot, normal);
            }
        }
    }

    getTransform(): TransformNode {
        return this.transform;
    }
}
