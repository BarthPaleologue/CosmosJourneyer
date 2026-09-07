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
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Observer } from "@babylonjs/core/Misc/observable";
import type { TFunction } from "i18next";

import type { Target } from "../../gameplay/targeting/target";
import { getSensorRange } from "../../gameplay/targeting/targetingSystem";
import type { TargetingSystem } from "../../gameplay/targeting/targetingSystem";
import { getCameraVerticalFov } from "../../helpers/getCameraVerticalFov";
import type { Transformable } from "../../simulation/architecture/transformable";
import { ObjectTargetCursor } from "./objectTargetCursor";
import { resolveReticleTarget } from "./resolveReticleTarget";
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

    /** Returns the same canonical contact whose hover indication was rendered, without resolving again. */
    public getHoveredTarget(): Target | null {
        return this.hoveredTarget;
    }

    public update(camera: Camera, controlledObject: Transformable | null): void {
        if (!this.isEnabled()) {
            return;
        }
        camera.getViewMatrix();
        camera.getProjectionMatrix();
        const transformation = camera.getTransformationMatrix();
        const selected = this.targetingSystem.getTarget();
        const forward = camera.getDirection(Vector3.Forward(camera.getScene().useRightHandedSystem));
        const projected = Vector3.Zero();
        const frame = [...this.targetCursors].map(([target, cursor]) => {
            const isSelected = target === selected;
            const sensorRange = this.targetingSystem.isKnown(target) || isSelected ? null : getSensorRange(target);
            target.getTransform().computeWorldMatrix(true);
            const position = target.getTransform().getAbsolutePosition();
            const offset = position.subtract(camera.globalPosition);
            Vector3.ProjectToRef(position, Matrix.IdentityReadOnly, transformation, camera.viewport, projected);
            const isOnScreen =
                Vector3.Dot(offset, forward) > 0 &&
                projected.x >= camera.viewport.x &&
                projected.x <= camera.viewport.x + camera.viewport.width &&
                projected.y >= camera.viewport.y &&
                projected.y <= camera.viewport.y + camera.viewport.height;
            const distance = offset.length();
            const opacity =
                isOnScreen && this.targetingSystem.isAvailable(target)
                    ? getTargetCursorOpacity(
                          target,
                          distance,
                          sensorRange,
                          isSelected,
                          this.targetingSystem.hasKnownOverride(target),
                      )
                    : 0;
            return { target, cursor, opacity };
        });
        const controlledTransform = controlledObject?.getTransform();
        const candidates = frame
            .filter(({ target, opacity }) => opacity > 0 && target.getTransform() !== controlledTransform)
            .map(({ target }) => target);
        this.hoveredTarget = resolveReticleTarget(
            candidates,
            {
                origin: camera.globalPosition,
                direction: forward,
            },
            getCameraVerticalFov(camera),
        );
        for (const { target, cursor, opacity } of frame) {
            cursor.setTarget(target === selected);
            cursor.setInformationEnabled(target === selected || target === this.hoveredTarget);
            cursor.update(camera, opacity);
        }
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
