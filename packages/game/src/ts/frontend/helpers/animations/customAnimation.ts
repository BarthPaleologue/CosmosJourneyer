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

import { clamp } from "@/utils/math";

type AnimationSampler<T> = (progress: number) => T;

type Easing = (progress: number) => number;

export class CustomAnimation<T> {
    private readonly sampler: AnimationSampler<T>;

    readonly durationSeconds: number;

    private elapsedSeconds = 0;

    constructor(sampler: AnimationSampler<T>, durationSeconds: number) {
        this.sampler = sampler;
        this.durationSeconds = durationSeconds;
    }

    static FromTo<T>(
        from: T,
        to: T,
        linearInterpolation: (from: T, to: T, progress: number) => T,
        durationSeconds: number,
        options?: Partial<{
            easing: Easing;
        }>,
    ): CustomAnimation<T> {
        const easing = options?.easing;

        const sampler: AnimationSampler<T> =
            easing === undefined
                ? (progress) => linearInterpolation(from, to, progress)
                : (progress) => {
                      const easedProgress = easing(progress);
                      return linearInterpolation(from, to, easedProgress);
                  };

        return new CustomAnimation(sampler, durationSeconds);
    }

    update(deltaSeconds: number) {
        this.elapsedSeconds += deltaSeconds;
    }

    private getCurrentProgress(): number {
        if (this.durationSeconds === 0) {
            return 1;
        }

        return clamp(this.elapsedSeconds / this.durationSeconds, 0, 1);
    }

    getCurrentValue(): T {
        return this.sampler(this.getCurrentProgress());
    }

    isFinished(): boolean {
        return this.elapsedSeconds >= this.durationSeconds;
    }

    reset() {
        this.elapsedSeconds = 0;
    }
}
