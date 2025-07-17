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

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type IDisposable } from "@babylonjs/core/scene";

import { type HasBoundingSphere } from "../universe/architecture/hasBoundingSphere";
import { type Targetable } from "../universe/architecture/targetable";
import { type Transformable } from "../universe/architecture/transformable";
import { type TypedObject } from "../universe/architecture/typedObject";
import { ObjectTargetCursor } from "./objectTargetCursor";

export class TargetCursorLayer implements IDisposable {
    private targetCursors: ObjectTargetCursor[] = [];

    private readonly layerRoot: HTMLDivElement;

    private target: (Transformable & HasBoundingSphere & TypedObject) | null = null;

    private closestToScreenCenterOrbitalObject: (Transformable & HasBoundingSphere & TypedObject) | null = null;

    constructor() {
        this.layerRoot = document.createElement("div");
        this.layerRoot.classList.add("targetCursorLayer");

        document.body.appendChild(this.layerRoot);
    }

    public setEnabled(enabled: boolean) {
        this.layerRoot.style.display = enabled ? "block" : "none";
    }

    public isEnabled() {
        return this.layerRoot.style.display === "block";
    }

    public addObject(object: Targetable) {
        const overlay = new ObjectTargetCursor(object);
        this.targetCursors.push(overlay);
        this.layerRoot.appendChild(overlay.htmlRoot);
    }

    private computeClosestToScreenCenterOrbitalObject() {
        let nearest = null;
        let closestDistance = Number.POSITIVE_INFINITY;
        this.targetCursors.forEach((overlay) => {
            if (!overlay.isVisible()) return;

            const screenCoordinates = overlay.screenCoordinates;
            const distance = screenCoordinates.subtract(new Vector3(0.5, 0.5, 0)).length();

            if (distance < closestDistance) {
                closestDistance = distance;
                nearest = overlay.object;
            }
        });

        this.closestToScreenCenterOrbitalObject = nearest;
    }

    public getClosestToScreenCenterOrbitalObject() {
        return this.closestToScreenCenterOrbitalObject;
    }

    public reset() {
        for (const targetCursor of this.targetCursors) {
            targetCursor.dispose();
        }
        this.targetCursors = [];
    }

    public setTarget(object: (Transformable & HasBoundingSphere & TypedObject) | null, forcedValue?: boolean) {
        let shouldHide = this.target === object;
        if (forcedValue !== undefined) shouldHide = !forcedValue;

        if (shouldHide) {
            this.target = null;
            return;
        }

        this.target = object;
    }

    public getTarget() {
        return this.target;
    }

    public update(camera: Camera) {
        for (const targetCursor of this.targetCursors) {
            targetCursor.update(camera);
            const distanceToCenterSquared =
                (targetCursor.screenCoordinates.x - 0.5) ** 2 + (targetCursor.screenCoordinates.y - 0.5) ** 2;
            const isHovered =
                distanceToCenterSquared < 0.1 * 0.1 && targetCursor.object === this.closestToScreenCenterOrbitalObject;
            const isTarget = targetCursor.object === this.target;
            targetCursor.setTarget(isTarget);
            targetCursor.setInformationEnabled(isTarget || isHovered);
        }
        this.computeClosestToScreenCenterOrbitalObject();
    }

    public dispose() {
        this.reset();
    }
}
