//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Quaternion, Vector3 } from "@babylonjs/core/pure";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { OrbitalObjectModelBase } from "@cosmos-journeyer/universe-model";

import type { GroundedLocation } from "@/backend/persistentEntities/persistentEntityModel";

import { CustomOrbitalObject } from "@/frontend/universe/customOrbitalObject";

import type { Targetable, TargetInfo } from "../universe/architecture/targetable";
import type { Transformable } from "../universe/architecture/transformable";
import type { PersistentEntityContent } from "./contentLoader";

export class OrbitalPersistentEntity implements Transformable {
    readonly orbitalObject: CustomOrbitalObject;
    private readonly content: PersistentEntityContent;
    constructor(content: PersistentEntityContent, orbitalObjectModel: DeepReadonly<OrbitalObjectModelBase<"custom">>) {
        this.orbitalObject = new CustomOrbitalObject(content.getTransform(), orbitalObjectModel, {
            getTypeName: () => "Curiosity",
        });

        this.content = content;
    }

    getTransform() {
        return this.orbitalObject.getTransform();
    }
}

export class GroundedPersistentEntity implements Transformable, Targetable {
    readonly location: GroundedLocation;
    private readonly content: PersistentEntityContent;

    readonly targetInfo: TargetInfo;

    constructor(
        content: PersistentEntityContent,
        location: GroundedLocation,
        radialDistance: number,
        parent: TransformNode,
    ) {
        this.content = content;
        this.location = location;

        const latitude = this.location.latitude;
        const longitude = this.location.longitude;

        const direction = new Vector3(
            Math.cos(latitude) * Math.cos(longitude),
            Math.sin(latitude),
            Math.cos(latitude) * Math.sin(longitude),
        );

        this.getTransform()
            .position.copyFrom(direction)
            .scaleInPlace(radialDistance + location.groundDeltaHeight);

        const orientation = Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly, direction, Quaternion.Identity());
        this.getTransform().rotationQuaternion = orientation;

        this.getTransform().parent = parent;

        this.targetInfo = {
            type: "FACILITY",
            name: this.getTransform().name,
            minDistance: 0,
            maxDistance: 0,
        };
    }

    getTransform() {
        return this.content.getTransform();
    }

    getBoundingRadius() {
        return 10e3;
    }

    getTypeName() {
        return "grounded entity!";
    }
}
