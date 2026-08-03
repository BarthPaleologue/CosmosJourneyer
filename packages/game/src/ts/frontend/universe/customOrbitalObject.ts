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
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { OrbitalObjectModelBase } from "@cosmos-journeyer/universe-model";

import type { OrbitalObjectBase } from "./architecture/orbitalObjectBase";
import { ObjectTargetCursorType } from "./architecture/targetable";
import type { Targetable, TargetInfo } from "./architecture/targetable";

type CustomOrbitalObjectOptions = Partial<{
    getTypeName: CustomOrbitalObject["getTypeName"];
}>;

export class CustomOrbitalObject implements OrbitalObjectBase<"custom">, Targetable {
    private readonly transform: TransformNode;
    readonly model: DeepReadonly<OrbitalObjectModelBase<"custom">>;
    readonly type: "custom";
    private readonly boundingRadius: number;
    readonly targetInfo: TargetInfo;

    private readonly _getTypeName: CustomOrbitalObject["getTypeName"];

    constructor(
        transform: TransformNode,
        model: DeepReadonly<OrbitalObjectModelBase<"custom">>,
        options?: CustomOrbitalObjectOptions,
    ) {
        this.transform = transform;
        this.transform.rotationQuaternion = Quaternion.Identity();

        this.model = model;
        this.type = model.type;

        const boundingVectors = this.getTransform().getHierarchyBoundingVectors();
        this.boundingRadius = boundingVectors.max.subtract(boundingVectors.min).length() / 2;

        this.targetInfo = {
            type: ObjectTargetCursorType.CELESTIAL_BODY,
            name: model.name,
            minDistance: 0,
            maxDistance: 0,
        };

        this._getTypeName = options?.getTypeName ?? (() => "Custom Orbital Object");
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    getBoundingRadius(): number {
        return this.boundingRadius;
    }

    getTypeName(): string {
        return this._getTypeName();
    }

    dispose(): void {
        this.getTransform().dispose();
    }
}
