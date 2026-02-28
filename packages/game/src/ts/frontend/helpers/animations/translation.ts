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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes";

import { clamp } from "@/utils/math";

import { translate } from "../transform";
import { type CustomAnimation } from "./animation";
import { easeInOutInterpolation } from "./interpolations";

export class TransformTranslationAnimation implements CustomAnimation {
    private elapsedSeconds = 0;
    private readonly duration: number;
    private distanceAcc = 0;
    private readonly totalDistance;
    private readonly direction: Vector3;
    private readonly transform: TransformNode;
    private finished = false;

    constructor(transform: TransformNode, targetPosition: Vector3, duration: number) {
        this.transform = transform;
        this.duration = duration;
        const deltaToTarget = targetPosition.subtract(transform.getAbsolutePosition());
        this.totalDistance = deltaToTarget.length();
        this.direction = this.totalDistance > 0 ? deltaToTarget.normalizeToNew() : Vector3.Zero();
    }

    update(deltaSeconds: number) {
        if (this.finished) return;

        this.elapsedSeconds += deltaSeconds;

        const t = clamp(this.elapsedSeconds / this.duration, 0, 1);

        const dDistance = this.totalDistance * easeInOutInterpolation(t) - this.distanceAcc;
        this.distanceAcc += dDistance;

        translate(this.transform, this.direction.scale(dDistance));

        if (this.elapsedSeconds >= this.duration) {
            const remainingDistance = this.totalDistance - this.distanceAcc;
            if (remainingDistance !== 0) {
                translate(this.transform, this.direction.scale(remainingDistance));
                this.distanceAcc = this.totalDistance;
            }
            this.finished = true;
        }
    }

    isFinished(): boolean {
        return this.finished;
    }

    getProgress(): number {
        return this.elapsedSeconds / this.duration;
    }
}
