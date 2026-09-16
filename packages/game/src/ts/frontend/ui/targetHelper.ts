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

import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";

export class TargetHelper {
    readonly root: HTMLElement;

    private readonly dot: HTMLElement;

    private enabled = true;

    constructor() {
        this.root = document.createElement("div");
        this.root.id = "targetHelper";

        this.dot = document.createElement("div");
        this.dot.id = "targetDot";
        this.root.appendChild(this.dot);
    }

    setEnabled(enabled: boolean): void {
        if (this.enabled === enabled) {
            return;
        }

        this.enabled = enabled;
        this.root.style.display = this.enabled ? "block" : "none";
    }

    update(targetPosition: Vector3, shipTransform: TransformNode): void {
        const shipPosition = shipTransform.getAbsolutePosition();
        const directionWorld = targetPosition.subtract(shipPosition).normalize();
        const directionLocal = Vector3.TransformNormal(directionWorld, Matrix.Invert(shipTransform.getWorldMatrix()));

        // set class of targetDot based on sign of directionLocal.z
        this.dot.className = directionLocal.z < 0 ? "targetDot" : "targetDot behind";

        // set top and left of targetDot based on direction2D (use %)
        this.dot.style.top = `${50 - 50 * directionLocal.y}%`;
        this.dot.style.left = `${50 + 50 * directionLocal.x}%`;
    }
}
