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

import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import type { Scene } from "@babylonjs/core/scene";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import { getCelestialBodyRadius } from "@cosmos-journeyer/universe-model";
import type { CelestialBodyModel, OrbitalObjectType } from "@cosmos-journeyer/universe-model";

import type { CelestialBodyBase } from "./architecture/celestialBody";

export class EmptyCelestialBody<TObjectType extends OrbitalObjectType> implements CelestialBodyBase<TObjectType> {
    readonly model: Extract<DeepReadonly<CelestialBodyModel>, { type: TObjectType }>;

    readonly type: DeepReadonly<TObjectType>;

    private readonly transform: TransformNode;

    readonly asteroidField = null;
    readonly ringsUniforms = null;

    /**
     * @param model The model to create the planet from or a seed for the planet in [-1, 1]
     * @param scene
     */
    constructor(model: Extract<DeepReadonly<CelestialBodyModel>, { type: TObjectType }>, scene: Scene) {
        this.model = model;

        this.type = model.type;

        this.transform = new TransformNode(this.model.name, scene);
        this.transform.rotationQuaternion = Quaternion.Identity();
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    getRadius(): number {
        return getCelestialBodyRadius(this.model);
    }

    getBoundingRadius(): number {
        return this.getRadius();
    }

    dispose(): void {
        this.transform.dispose();
    }
}
