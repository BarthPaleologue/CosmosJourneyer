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
import type { Observer } from "@babylonjs/core/Misc/observable";
import type { TFunction } from "i18next";

import type { Target } from "../../gameplay/targeting/target";
import { getSensorRange } from "../../gameplay/targeting/targetingSystem";
import type { TargetingSystem } from "../../gameplay/targeting/targetingSystem";
import { ObjectTargetCursor } from "./objectTargetCursor";
import { getTargetCursorOpacity } from "./targetAppearance";

export class TargetCursorLayer {
    private hoveredTarget: Target | null = null;
    private readonly targetCursors = new Map<Target, ObjectTargetCursor>();
    private readonly root: HTMLDivElement;

    private readonly targetingSystem: TargetingSystem;
    private readonly t: TFunction;
    private readonly targetsAddedObserver: Observer<Iterable<Target>>;
    private readonly targetsRemovedObserver: Observer<Iterable<Target>>;

    constructor(targetingSystem: TargetingSystem, t: TFunction) {
        this.targetingSystem = targetingSystem;
        this.t = t;
        this.root = document.createElement("div");
        this.root.classList.add("targetCursorLayer");
        document.body.appendChild(this.root);
        this.targetsAddedObserver = targetingSystem.onTargetsAddedObservable.add((targets) => {
            this.addTargets(targets);
        });
        this.targetsRemovedObserver = targetingSystem.onTargetsRemovedObservable.add((targets) => {
            for (const target of targets) {
                if (this.hoveredTarget === target) {
                    this.hoveredTarget = null;
                }
                this.targetCursors.get(target)?.dispose();
                this.targetCursors.delete(target);
            }
        });
        this.addTargets(targetingSystem.getTargets());
    }

    public setEnabled(enabled: boolean): void {
        this.root.style.display = enabled ? "block" : "none";
        if (!enabled) {
            this.hoveredTarget = null;
        }
    }

    public isEnabled(): boolean {
        return this.root.style.display === "block";
    }

    private addTargets(targets: Iterable<Target>): void {
        for (const target of targets) {
            const cursor = new ObjectTargetCursor(target, this.t);
            this.targetCursors.set(target, cursor);
            this.root.appendChild(cursor.htmlRoot);
        }
    }

    public getClosestToScreenCenterOrbitalObject(): Target | null {
        return this.hoveredTarget;
    }

    public update(camera: Camera): void {
        if (!this.isEnabled()) {
            return;
        }
        camera.getViewMatrix();
        camera.getProjectionMatrix();
        const selected = this.targetingSystem.getTarget();
        const forward = camera.getDirection(Vector3.Forward(camera.getScene().useRightHandedSystem));
        let nearest: Target | null = null;
        let closestDistance = Infinity;
        for (const [target, cursor] of this.targetCursors) {
            const isSelected = target === selected;
            const sensorRange = this.targetingSystem.isKnown(target) || isSelected ? null : getSensorRange(target);
            target.getTransform().computeWorldMatrix(true);
            const offset = target.getTransform().getAbsolutePosition().subtract(camera.globalPosition);
            const opacity = this.targetingSystem.isAvailable(target)
                ? getTargetCursorOpacity(
                      target,
                      offset.length(),
                      sensorRange,
                      isSelected,
                      this.targetingSystem.hasKnownOverride(target),
                  )
                : 0;
            cursor.update(camera, opacity);
            const distanceToCenterSquared =
                (cursor.screenCoordinates.x - 0.5) ** 2 + (cursor.screenCoordinates.y - 0.5) ** 2;
            const isHovered = distanceToCenterSquared < 0.1 * 0.1 && target === this.hoveredTarget;
            cursor.setTarget(isSelected);
            cursor.setInformationEnabled(isSelected || isHovered);
            if (opacity > 0 && Vector3.Dot(offset, forward) > 0) {
                const distance = cursor.screenCoordinates.subtract(new Vector3(0.5, 0.5, 0)).length();
                if (distance < closestDistance) {
                    closestDistance = distance;
                    nearest = target;
                }
            }
        }
        this.hoveredTarget = nearest;
    }

    public dispose(): void {
        this.setEnabled(false);
        this.targetsAddedObserver.remove();
        this.targetsRemovedObserver.remove();
        for (const cursor of this.targetCursors.values()) {
            cursor.dispose();
        }
        this.targetCursors.clear();
        this.root.remove();
    }
}
