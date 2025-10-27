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

import { clamp } from "@/utils/math";

import { type CustomAnimation } from "./animation";

export class CameraShakeAnimation implements CustomAnimation {
    private elapsedSeconds = 0;
    private readonly duration: number;
    private readonly intensity: number;

    private readonly camera: ArcRotateCamera;

    constructor(camera: ArcRotateCamera, intensity: number, duration: number) {
        this.camera = camera;
        this.intensity = intensity;
        this.duration = duration;
        this.elapsedSeconds = duration; // TODO: Temporary fix for startup shake until proper logic (see issue #559).
    }

    private sumOfSines(t: number, frequency: number, phase: number): number {
        let sum = 0;
        for (let i = 0; i < 5; i++) {
            sum += Math.sin(2 * Math.PI * frequency * t * 2 ** i + phase) / 2 ** i;
        }
        return sum;
    }

    update(deltaSeconds: number) {
        if (this.isFinished()) return;

        this.elapsedSeconds += deltaSeconds;

        const t = clamp(this.elapsedSeconds / this.duration, 0, 1);

        const frequency = 10;

        this.camera.alpha += this.sumOfSines(t, frequency, 0) * this.intensity;
        this.camera.beta += this.sumOfSines(t, frequency, 0.38) * this.intensity;
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
