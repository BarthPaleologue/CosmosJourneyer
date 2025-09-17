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
        mirrorMaterial.metallic = 1;
        mirrorMaterial.roughness = 0.02;
        mirrorMaterial.baseColor = new Color3(1, 0.7766, 0.3362); // gold-like
        //mirrorMaterial.emissiveColor = mirrorMaterial.baseColor.scaleInPlace(0.2);

        const hexRadius = model.segmentation.tileRadius; // circumradius (center -> vertex)
        const hexHeight = 0.01;

        // flat-to-flat (side-to-side) width and apothem
        const flat = Math.sqrt(3) * hexRadius; // flat-to-flat distance

        // spacing scale: add physical 'gap' between flat faces, not relative to circumradius
        const spacingScale = (flat + model.segmentation.gap) / flat;

        const ringCount = Math.floor(model.apertureRadius / flat);

        // iterate axial coords inside a hex-shaped area of radius `ringCount`
        for (let q = -ringCount; q <= ringCount; q++) {
            const rMin = Math.max(-ringCount, -q - ringCount);
            const rMax = Math.min(ringCount, -q + ringCount);
            for (let r = rMin; r <= rMax; r++) {
                // hex (axial) distance from center
                const hexDist = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;

                // For JWST we want the two rings around the center (exclude center)
                if (hexDist < 1 || hexDist > ringCount) continue;

                const xPos = hexRadius * 1.5 * q * spacingScale;
                const zPos = hexRadius * Math.sqrt(3) * (r + q / 2) * spacingScale;

                const dist = xPos * xPos + zPos * zPos;

                // preserve optional central obstruction
                if (receptorRadius > 0 && dist < receptorRadius ** 2) continue;

                const eps = 1e-9;
                const apertureR2 = model.apertureRadius * model.apertureRadius + eps;
                let includeTile = false;

                // center inside?
                if (dist <= apertureR2) {
                    includeTile = true;
                } else {
                    // check hex vertices: pointy-top orientation (angles 0..5 * 60°)
                    // if your hex orientation is rotated by 30°, add Math.PI/6 to angle
                    const rotation = 0; // change to Math.PI/6 if your hex faces are rotated
                    for (let k = 0; k < 6; k++) {
                        const ang = (Math.PI / 3) * k + rotation;
                        const vx = xPos + hexRadius * Math.cos(ang);
                        const vz = zPos + hexRadius * Math.sin(ang);
                        if (vx * vx + vz * vz <= apertureR2) {
                            includeTile = true;
                            break;
                        }
                    }
                }

                if (!includeTile) continue;

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
