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
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { type DarkKnightModel } from "@/backend/universe/orbitalObjects/anomalies/darkKnightModel";
import { type OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";

import { getOrbitalObjectTypeToI18nString } from "@/frontend/helpers/orbitalObjectTypeToDisplay";
import { type RingsUniforms } from "@/frontend/postProcesses/rings/ringsUniform";

import { type DeepReadonly } from "@/utils/types";

import { type CelestialBodyBase } from "./architecture/celestialBody";
import { ObjectTargetCursorType, type TargetInfo } from "./architecture/targetable";
import { type AsteroidField } from "./asteroidFields/asteroidField";

export class DarkKnight implements CelestialBodyBase<OrbitalObjectType.DARK_KNIGHT> {
    readonly type: OrbitalObjectType.DARK_KNIGHT;

    readonly model: DeepReadonly<DarkKnightModel>;

    private readonly mesh: Mesh;

    private readonly material: PBRMetallicRoughnessMaterial;

    readonly ringsUniforms: RingsUniforms | null = null;
    readonly asteroidField: AsteroidField | null = null;
    readonly targetInfo: TargetInfo;

    constructor(model: DeepReadonly<DarkKnightModel>, scene: Scene) {
        this.type = model.type;
        this.model = model;

        this.mesh = MeshBuilder.CreateSphere("DarkKnight", { diameter: this.model.radius, segments: 256 }, scene);

        this.material = new PBRMetallicRoughnessMaterial("DarkKnightMaterial", scene);
        this.material.metallic = 1;
        this.material.roughness = 0.0;
        this.material.disableLighting = true;

        this.mesh.material = this.material;

        this.targetInfo = {
            type: ObjectTargetCursorType.ANOMALY,
            minDistance: this.model.radius * 5,
            maxDistance: this.model.radius * 100,
        };
    }

    getRadius(): number {
        return this.model.radius;
    }

    getBoundingRadius(): number {
        return this.model.radius;
    }

    getTypeName(): string {
        return getOrbitalObjectTypeToI18nString(this.model);
    }

    getTransform(): TransformNode {
        return this.mesh;
    }

    dispose(): void {
        this.mesh.dispose();
    }
}
