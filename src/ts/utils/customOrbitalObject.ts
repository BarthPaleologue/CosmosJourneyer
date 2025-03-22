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

import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import { OrbitalObjectBase } from "../architecture/orbitalObjectBase";
import { OrbitalObjectModelBase } from "../architecture/orbitalObjectModelBase";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";
import { DeepReadonly } from "./types";

export class CustomOrbitalObject implements OrbitalObjectBase<OrbitalObjectType.CUSTOM> {
    private readonly _transform: TransformNode;
    readonly model: DeepReadonly<OrbitalObjectModelBase<OrbitalObjectType.CUSTOM>>;
    readonly type: OrbitalObjectType.CUSTOM;
    private readonly boundingRadius: number;
    constructor(transform: TransformNode, model: DeepReadonly<OrbitalObjectModelBase<OrbitalObjectType.CUSTOM>>) {
        this._transform = transform;
        this._transform.rotationQuaternion = Quaternion.Identity();

        this.model = model;
        this.type = model.type;

        const boundingVectors = this.getTransform().getHierarchyBoundingVectors();
        this.boundingRadius = boundingVectors.max.subtract(boundingVectors.min).length() / 2;
    }

    getTransform(): TransformNode {
        return this._transform;
    }

    getBoundingRadius(): number {
        return this.boundingRadius;
    }

    getTypeName(): string {
        return "Wrapped Orbital Object";
    }

    dispose(): void {
        this.getTransform().dispose();
    }
}
