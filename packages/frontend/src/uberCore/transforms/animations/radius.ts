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

import { type ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Lerp } from "@babylonjs/core/Maths/math.scalar.functions";

import { clamp } from "@/utils/math";

import { type CustomAnimation } from "./animation";
import { easeInOutInterpolation } from "./interpolations";

export class CameraRadiusAnimation implements CustomAnimation {
    private elapsedSeconds = 0;
    private readonly duration: number;
    private readonly startRadius: number;
    private readonly targetRadius: number;
    private readonly camera: ArcRotateCamera;

    constructor(camera: ArcRotateCamera, targetRadius: number, duration: number) {
        this.camera = camera;
        this.duration = duration;
        this.startRadius = camera.radius;
        this.targetRadius = targetRadius;
    }

    update(deltaTime: number) {
        if (this.isFinished()) return;

        this.elapsedSeconds += deltaTime;

        const t = clamp(this.elapsedSeconds / this.duration, 0, 1);

        this.camera.radius = Lerp(this.startRadius, this.targetRadius, easeInOutInterpolation(t));
    }

    isFinished(): boolean {
        return this.elapsedSeconds >= this.duration;
    }

    getProgress(): number {
        return this.elapsedSeconds / this.duration;
    }
}
