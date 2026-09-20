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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

import type { Target } from "../target";
import type { Sensor } from "./sensor";

export class OpticalSensor implements Sensor {
    private readonly transform: TransformNode;

    constructor(name: string, scene: Scene) {
        this.transform = new TransformNode(name, scene);
    }

    detects(target: Target) {
        const targetPosition = target.getTransform().getAbsolutePosition();
        const sensorPosition = this.transform.getAbsolutePosition();

        const distance2 = Vector3.DistanceSquared(targetPosition, sensorPosition);

        const maxDetectionDistance = 100 * target.getBoundingRadius();

        return distance2 < maxDetectionDistance ** 2;
    }

    getTransform() {
        return this.transform;
    }
}
