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
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { type Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
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
    private readonly root: TransformNode;
    private readonly lampPost: Mesh;
    private readonly lightCap: Mesh;
    private readonly lightDisk: Mesh;

    readonly lights: Array<SpotLight> = [];

    private readonly height: number;
    private readonly aperture: number;

    private readonly scene: Scene;

    constructor(lightAperture: number, capSize: number, postHeight: number, scene: Scene) {
        this.root = new TransformNode("ProceduralSpotLightInstancesRoot", scene);

        this.lampPost = MeshBuilder.CreateCylinder(
            "Lamp Post",
            {
                diameter: capSize * 0.3,
                height: postHeight,
            },
            scene,
        );
        this.lampPost.translate(Vector3.UpReadOnly, postHeight / 2);
        this.lampPost.bakeCurrentTransformIntoVertices();
        this.lampPost.parent = this.root;

        const lampPostMaterial = new PBRMaterial("LampPostMaterial", scene);
        lampPostMaterial.metallic = 1;
        lampPostMaterial.roughness = 0.4;
        this.lampPost.material = lampPostMaterial;

        this.height = postHeight;
        this.aperture = lightAperture;
        this.scene = scene;

        const lightCapHeight = capSize;
        this.lightCap = MeshBuilder.CreateCylinder(
            "Light Cap",
            {
                diameterBottom: Math.tan(lightAperture / 2) * lightCapHeight,
                diameterTop: Math.tan(lightAperture / 2) * lightCapHeight * 2,
                height: lightCapHeight,
            },
            scene,
        );
        this.lightCap.translate(Vector3.UpReadOnly, lightCapHeight / 2);
        this.lightCap.bakeCurrentTransformIntoVertices();
        this.lightCap.parent = this.root;

        const lightCapMaterial = new PBRMaterial("LightCapMaterial", scene);
        lightCapMaterial.metallic = 1;
        lightCapMaterial.roughness = 0.2;
        this.lightCap.material = lightCapMaterial;

        this.lightDisk = MeshBuilder.CreateDisc(
            "Light Disk",
            {
                radius: Math.tan(lightAperture / 2) * lightCapHeight * 0.8,
            },
            scene,
        );
        this.lightDisk.rotate(Vector3.RightReadOnly, Math.PI / 2);
        this.lightDisk.translate(Vector3.RightHandedForwardReadOnly, lightCapHeight);
        this.lightDisk.bakeCurrentTransformIntoVertices();
        this.lightDisk.parent = this.root;

        this.lightDisk.thinInstanceRegisterAttribute("color", 4);

        const lightDiskMaterial = new InstanceGlowMaterial(scene).get();
        lightDiskMaterial.zOffset = -2;

        this.lightDisk.material = lightDiskMaterial;
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
                2,
                this.scene,
                true,
            );
            light.diffuse = color;
            light.range = range ?? 10;
            light.parent = this.root;
            this.lights.push(light);
        }

        this.lampPost.thinInstanceSetBuffer("matrix", postTransforms, 16, true);
        this.lightCap.thinInstanceSetBuffer("matrix", lampTransforms, 16, true);
        this.lightDisk.thinInstanceSetBuffer("matrix", lampTransforms, 16, true);
        this.lightDisk.thinInstanceSetBuffer("color", lightColors, 4, false);
    }

    getTransform(): TransformNode {
        return this.root;
    }

    setColorAt(index: number, color: Color3): void {
        const light = this.lights[index];
        if (light === undefined) {
            console.warn(`No light found at index ${index}`);
            return;
        }

        const value = [color.r, color.g, color.b, 1];
        this.lightDisk.thinInstanceSetAttributeAt("color", index, value);
        light.diffuse = color;
    }

    dispose() {
        this.lampPost.dispose(false, true);
        this.lightCap.dispose(false, true);
        this.lightDisk.dispose(false, true);
        this.root.dispose();
    }
}
