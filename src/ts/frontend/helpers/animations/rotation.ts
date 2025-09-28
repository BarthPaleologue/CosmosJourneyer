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

import { type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes";

import { clamp } from "@/utils/math";

import { rotate } from "../transform";
import { type CustomAnimation } from "./animation";
import { easeInOutInterpolation } from "./interpolations";

export class TransformRotationAnimation implements CustomAnimation {
    private clock = 0;
    private readonly duration: number;
    private thetaAcc = 0;
    private readonly totalTheta;
    private readonly axis;
    private readonly transform: TransformNode;

    constructor(transform: TransformNode, axis: Vector3, theta: number, duration: number) {
        this.transform = transform;
        this.axis = axis;
        this.totalTheta = theta;
        this.duration = duration;
    }

    update(deltaSeconds: number) {
        if (this.isFinished()) return;

        this.clock += deltaSeconds;

        const t = clamp(this.clock / this.duration, 0, 1);

        const dtheta = this.totalTheta * easeInOutInterpolation(t) - this.thetaAcc;
        this.thetaAcc += dtheta;

        rotate(this.transform, this.axis, dtheta);
    }

    isFinished(): boolean {
        return this.clock >= this.duration;
    }

    getProgress(): number {
        return this.clock / this.duration;
    }
}
