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

import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector2 } from "@babylonjs/core/Maths/math.vector";

import { CustomAnimation } from "./customAnimation";

/**
 * @param elapsedSeconds - Time coordinate supplied to the sine signal.
 * @param baseFrequency - Frequency of the lowest sine octave.
 * @param phase - Phase offset in radians.
 * @returns The normalized sum of the four sine octaves.
 */
function sumOfSines(elapsedSeconds: number, baseFrequency: number, phase: number): number {
    let sum = 0;
    let normalization = 0;

    for (let i = 0; i < 4; i++) {
        const octave = 2 ** i;
        const amplitude = 1 / octave;
        const frequency = baseFrequency * octave;

        sum += amplitude * Math.sin(2 * Math.PI * frequency * elapsedSeconds + phase);
        normalization += amplitude;
    }

    return sum / normalization;
}

/**
 * @param progress - Normalized animation progress from zero to one.
 * @returns The sine envelope intensity.
 */
function burstEnvelope(progress: number): number {
    return Math.sin(Math.PI * progress);
}

/**
 * @param camera - Camera whose initial alpha and beta anchor the shake.
 * @param baseIntensity - Peak angular shake intensity.
 * @param durationSeconds - Animation duration in seconds.
 * @returns Animation yielding camera alpha and beta angles.
 */
export function createCameraShakeAnimation(
    camera: ArcRotateCamera,
    baseIntensity: number,
    durationSeconds: number,
): CustomAnimation<Vector2> {
    const baseAlpha = camera.alpha;
    const baseBeta = camera.beta;
    return new CustomAnimation((progress) => {
        const intensity = burstEnvelope(progress) * baseIntensity;
        return new Vector2(
            baseAlpha + sumOfSines(progress, 10, 0) * intensity,
            baseBeta + sumOfSines(progress, 10, 0.38) * intensity,
        );
    }, durationSeconds);
}
