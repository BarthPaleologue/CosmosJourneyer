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

import { translate } from "../transform";
import { CustomAnimation } from "./customAnimation";
import { easeInOutQuadratic } from "./interpolations";

export class TransformTranslationAnimation {
    private readonly transform: TransformNode;
    private lastValue: Vector3;
    private readonly animation: CustomAnimation<Vector3>;

    constructor(transform: TransformNode, targetPosition: Vector3, duration: number) {
        this.transform = transform;
        this.lastValue = transform.getAbsolutePosition().clone();
        this.animation = CustomAnimation.FromTo(
            this.lastValue,
            targetPosition,
            (a, b, t) => Vector3.Lerp(a, b, t),
            duration,
            { easing: easeInOutQuadratic },
        );
    }

    update(deltaSeconds: number) {
        if (this.animation.isFinished()) {
            return;
        }

        this.animation.update(deltaSeconds);
        const currentPosition = this.animation.getCurrentValue();
        const offset = currentPosition.subtract(this.lastValue);
        translate(this.transform, offset);
        this.lastValue = currentPosition;
    }

    isFinished(): boolean {
        return this.animation.isFinished();
    }
}
