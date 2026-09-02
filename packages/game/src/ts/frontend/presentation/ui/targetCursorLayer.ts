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

import type { Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { IDisposable } from "@babylonjs/core/scene";
import type { TFunction } from "i18next";

import type { Target } from "../../gameplay/targetable";
import type { Transformable } from "../../simulation/architecture/transformable";
import { ObjectTargetCursor } from "./objectTargetCursor";

export class TargetCursorLayer implements IDisposable {
    private targetCursors: ObjectTargetCursor[] = [];

    private readonly layerRoot: HTMLDivElement;

    private target: Target | null = null;

    private readonly additionalPinnedTargets: Set<Target> = new Set();

    private closestToScreenCenterOrbitalObject: Target | null = null;
    private readonly t: TFunction;

    constructor(t: TFunction) {
        this.t = t;
        this.layerRoot = document.createElement("div");
        this.layerRoot.classList.add("targetCursorLayer");

        document.body.appendChild(this.layerRoot);
    }

    public setEnabled(enabled: boolean): void {
        this.layerRoot.style.display = enabled ? "block" : "none";
    }

    public isEnabled(): boolean {
        return this.layerRoot.style.display === "block";
    }

    public addTargets(objects: Iterable<Target>): void {
        for (const object of objects) {
            const overlay = new ObjectTargetCursor(object, this.t);
            this.targetCursors.push(overlay);
            this.layerRoot.appendChild(overlay.htmlRoot);
        }
    }

    public removeTarget(object: Target | Transformable): void {
        const targetCursor = this.targetCursors.find(
            (cursor) => cursor.object.getTransform() === object.getTransform(),
        );
        if (targetCursor === undefined) {
            return;
        }

        const target = targetCursor.object;
        this.targetCursors = this.targetCursors.filter((cursor) => cursor.object !== target);
        this.additionalPinnedTargets.delete(target);
        targetCursor.dispose();

        if (this.target === target) {
            this.target = null;
        }

        if (this.closestToScreenCenterOrbitalObject === target) {
            this.closestToScreenCenterOrbitalObject = null;
        }
    }

    private computeClosestToScreenCenterOrbitalObject(): void {
        let nearest = null;
        let closestDistance = Number.POSITIVE_INFINITY;
        this.targetCursors.forEach((overlay) => {
            if (!overlay.isVisible()) {
                return;
            }

            const screenCoordinates = overlay.screenCoordinates;
            const distance = screenCoordinates.subtract(new Vector3(0.5, 0.5, 0)).length();

            if (distance < closestDistance) {
                closestDistance = distance;
                nearest = overlay.object;
            }
        });

        this.closestToScreenCenterOrbitalObject = nearest;
    }

    public getClosestToScreenCenterOrbitalObject(): Target | null {
        return this.closestToScreenCenterOrbitalObject;
    }

    public reset(): void {
        for (const targetCursor of this.targetCursors) {
            targetCursor.dispose();
        }
        this.targetCursors.length = 0;
        this.setTarget(null);
    }

    public setTarget(object: Target | Transformable | null, forcedValue?: boolean): void {
        const target =
            object === null
                ? null
                : (this.targetCursors.find((cursor) => cursor.object.getTransform() === object.getTransform())
                      ?.object ?? null);
        let shouldHide = this.target === target;
        if (forcedValue !== undefined) {
            shouldHide = !forcedValue;
        }

        if (shouldHide) {
            this.target = null;
            return;
        }

        this.target = target;
    }

    public getTarget(): Target | null {
        return this.target;
    }

    public setAdditionalPinnedTargets(objects: Iterable<Target>): void {
        this.additionalPinnedTargets.clear();
        for (const object of objects) {
            const target = this.targetCursors.find(
                (cursor) => cursor.object.getTransform() === object.getTransform(),
            )?.object;
            if (target !== undefined) {
                this.additionalPinnedTargets.add(target);
            }
        }
    }

    public update(camera: Camera): void {
        if (!this.isEnabled()) {
            return;
        }
        for (const targetCursor of this.targetCursors) {
            targetCursor.setPinned(this.additionalPinnedTargets.has(targetCursor.object));
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

    public dispose(): void {
        this.reset();
    }
}
