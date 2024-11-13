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
import { easeInOutInterpolation } from "./interpolations";
import { TransformNode } from "@babylonjs/core/Meshes";
import { translate } from "../basicTransform";
import { clamp } from "../../../utils/math";
import { CustomAnimation } from "./animation";
import { ArcRotateCamera } from "@babylonjs/core";

export class CameraShakeAnimation implements CustomAnimation {
    private elapsedSeconds = 0;
    private readonly duration: number;
    private readonly intensity: number;

    private readonly camera: ArcRotateCamera;

    constructor(camera: ArcRotateCamera, intensity: number, duration: number) {
        this.camera = camera;
        this.intensity = intensity;
        this.duration = duration;
    }

    update(deltaSeconds: number) {
        if (this.isFinished()) return;

        this.elapsedSeconds += deltaSeconds;

        const t = clamp(this.elapsedSeconds / this.duration, 0, 1);

        const frequency = 10;

        this.camera.alpha += Math.sin(2 * Math.PI * frequency * t) * this.intensity;
        this.camera.beta += Math.cos(2 * Math.PI * frequency * t) * this.intensity;
    }

    reset() {
        this.elapsedSeconds = 0;
    }

    isFinished(): boolean {
        return this.elapsedSeconds >= this.duration;
    }

    getProgress(): number {
        return this.elapsedSeconds / this.duration;
    }
}
