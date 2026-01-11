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

import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import type { Material } from "@babylonjs/core/Materials/material";
import { type Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

import type { Transformable } from "@/frontend/universe/architecture/transformable";

import { InstanceGlowMaterial } from "../materials/instanceGlow";

export type ProceduralSpotLightInstanceData = {
    rootPosition: Vector3;
    upDirection?: Vector3;
    lookAtTarget: Vector3;
    color: Color3;
    range?: number;
};

export class ProceduralSpotLightInstances implements Transformable {
    private readonly lampPost: Mesh;

    private readonly lightCap: Mesh;

    private readonly lightDisk: Mesh;
    private readonly lightDiskMaterial: Material;

    readonly lights: Array<SpotLight> = [];

    private readonly height: number;

    private readonly aperture: number;

    private readonly scene: Scene;

    constructor(aperture: number, size: number, range: number, height: number, scene: Scene) {
        this.lampPost = MeshBuilder.CreateCylinder(
            "Lamp Post",
            {
                diameter: 0.1,
                height: height,
            },
            scene,
        );
        this.lampPost.translate(Vector3.UpReadOnly, height / 2);
        this.lampPost.bakeCurrentTransformIntoVertices();

        this.height = height;
        this.aperture = aperture;
        this.scene = scene;

        const lightCapHeight = size;
        this.lightCap = MeshBuilder.CreateCylinder(
            "Light Cap",
            {
                diameterBottom: Math.tan(aperture / 2) * lightCapHeight,
                diameterTop: Math.tan(aperture / 2) * lightCapHeight * 2,
                height: lightCapHeight,
            },
            scene,
        );
        this.lightCap.bakeCurrentTransformIntoVertices();

        this.lightDisk = MeshBuilder.CreateDisc(
            "Light Disk",
            {
                radius: Math.tan(aperture / 2) * lightCapHeight * 0.8,
            },
            scene,
        );
        this.lightDisk.rotate(Vector3.RightReadOnly, Math.PI / 2);
        this.lightDisk.translate(Vector3.RightHandedForwardReadOnly, lightCapHeight / 2);
        this.lightDisk.bakeCurrentTransformIntoVertices();

        this.lightDisk.thinInstanceRegisterAttribute("color", 4);

        this.lightDiskMaterial = new InstanceGlowMaterial(scene).get();
        this.lightDiskMaterial.zOffset = -2;

        this.lightDisk.material = this.lightDiskMaterial;
    }

    setInstances(instanceData: ReadonlyArray<ProceduralSpotLightInstanceData>): void {
        const instanceCount = instanceData.length;
        const postTransforms = new Float32Array(instanceCount * 16);
        const lampTransforms = new Float32Array(instanceCount * 16);
        const lightColors = new Float32Array(instanceCount * 4);
        for (const [i, { rootPosition, upDirection, lookAtTarget, color, range }] of instanceData.entries()) {
            const upDirectionFinal = upDirection ?? Vector3.UpReadOnly;
            const postTransform = Matrix.Compose(
                Vector3.OneReadOnly,
                Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly, upDirectionFinal, Quaternion.Identity()),
                rootPosition,
            );
            postTransform.copyToArray(postTransforms, i * 16);

            const lampPosition = rootPosition.add(upDirectionFinal.scale(this.height));
            const lampTransform = Matrix.Compose(
                Vector3.OneReadOnly,
                Quaternion.FromUnitVectorsToRef(
                    Vector3.UpReadOnly,
                    lookAtTarget.subtract(lampPosition).normalize(),
                    Quaternion.Identity(),
                ),
                lampPosition,
            );
            lampTransform.copyToArray(lampTransforms, i * 16);

            lightColors[i * 4 + 0] = color.r;
            lightColors[i * 4 + 1] = color.g;
            lightColors[i * 4 + 2] = color.b;
            lightColors[i * 4 + 3] = 1;

            const light = new SpotLight(
                "ProceduralSpotLight",
                lampPosition,
                lookAtTarget.subtract(lampPosition).normalize(),
                this.aperture,
                6,
                this.scene,
                true,
            );
            light.diffuse = color;
            light.range = range ?? 10;
            this.lights.push(light);
        }

        this.lampPost.thinInstanceSetBuffer("matrix", postTransforms, 16, true);
        this.lightCap.thinInstanceSetBuffer("matrix", lampTransforms, 16, true);
        this.lightDisk.thinInstanceSetBuffer("matrix", lampTransforms, 16, true);
        this.lightDisk.thinInstanceSetBuffer("color", lightColors, 4, true);
    }

    getTransform(): TransformNode {
        return this.lightCap;
    }

    dispose() {
        this.lightDiskMaterial.dispose();
        this.lampPost.dispose();
        this.lightCap.dispose();
    }
}
