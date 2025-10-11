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
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

import type { Transformable } from "@/frontend/universe/architecture/transformable";

export class ProceduralSpotLight implements Transformable {
    readonly lightCap: Mesh;

    readonly light: SpotLight;

    readonly color = Color3.White();

    constructor(aperture: number, size: number, range: number, scene: Scene) {
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
        this.lightCap.rotation.x = -Math.PI / 2;
        this.lightCap.bakeCurrentTransformIntoVertices();
        this.lightCap.position.addInPlace(Vector3.Forward(scene.useRightHandedSystem).scale(lightCapHeight / 2));
        this.lightCap.bakeCurrentTransformIntoVertices();

        const lightDisk = MeshBuilder.CreateDisc(
            "Light Disk",
            {
                radius: Math.tan(aperture / 2) * lightCapHeight * 0.8,
            },
            scene,
        );
        lightDisk.parent = this.lightCap;
        lightDisk.position.addInPlace(Vector3.Forward(scene.useRightHandedSystem).scale(lightCapHeight + 0.01));

        const lightCapDiskMaterial = new StandardMaterial("LightCapDiskMaterial", scene);
        lightCapDiskMaterial.emissiveColor = this.color;
        lightCapDiskMaterial.disableLighting = true;
        lightDisk.material = lightCapDiskMaterial;

        this.light = new SpotLight(
            "SpotLight",
            Vector3.Zero(),
            Vector3.Forward(scene.useRightHandedSystem),
            aperture,
            2,
            scene,
        );
        this.light.range = range;
        this.light.diffuse = this.color;
        this.light.specular = this.color;

        this.light.parent = this.lightCap;
    }

    getTransform(): TransformNode {
        return this.lightCap;
    }
}
