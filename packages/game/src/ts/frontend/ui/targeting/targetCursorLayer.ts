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
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { TFunction } from "i18next";

import type { Target } from "../../targeting/target";
import { TargetAcquisition } from "../../targeting/targetContact";
import type { TargetContact } from "../../targeting/targetContact";
import type { Transformable } from "../../universe/architecture/transformable";
import { ObjectTargetCursor } from "./objectTargetCursor";
import { getTargetCursorOpacity } from "./targetAppearance";

const sensorRangeFactor = 100;

function getSensorRange(target: Target): number {
    return target.getBoundingRadius() * sensorRangeFactor;
}

export class TargetCursorLayer {
    private closestToScreenCenterTarget: Target | null = null;
    private readonly targetCursors = new Map<Target, ObjectTargetCursor>();
    private readonly root: HTMLDivElement;

    private readonly targets = new Map<TransformNode, TargetContact>();
    private target: Target | null = null;
    private readonly knownTargets = new Set<TransformNode>();
    private readonly observerPosition = Vector3.Zero();

    private readonly t: TFunction;

    constructor(t: TFunction) {
        this.t = t;
        this.root = document.createElement("div");
        this.root.classList.add("targetCursorLayer");
        document.body.appendChild(this.root);
    }

    public setEnabled(enabled: boolean): void {
        this.root.style.display = enabled ? "block" : "none";
        if (!enabled) {
            this.closestToScreenCenterTarget = null;
        }
    }

    public isEnabled(): boolean {
        return this.root.style.display === "block";
    }

    public addContacts(contacts: Iterable<TargetContact>): void {
        for (const contact of contacts) {
            const target = contact.target;
            const transform = target.getTransform();
            if (this.targets.has(transform)) {
                continue;
            }
            this.targets.set(transform, contact);
            const cursor = new ObjectTargetCursor(target, this.t);
            this.targetCursors.set(target, cursor);
            this.root.appendChild(cursor.htmlRoot);
        }
    }

    public removeTarget(object: Transformable): void {
        const target = this.targets.get(object.getTransform())?.target;
        if (target === undefined) {
            return;
        }
        this.targets.delete(object.getTransform());
        this.knownTargets.delete(object.getTransform());
        if (this.target === target) {
            this.target = null;
        }
        if (this.closestToScreenCenterTarget === target) {
            this.closestToScreenCenterTarget = null;
        }
        this.targetCursors.get(target)?.dispose();
        this.targetCursors.delete(target);
    }

    /** Updates the observer position used by sensor acquisition, independently of any cursor lifetime. */
    public updateObserverPosition(observerPosition: Vector3): void {
        this.observerPosition.copyFrom(observerPosition);
    }

    public reset(): void {
        this.targets.clear();
        this.target = null;
        this.knownTargets.clear();
        this.observerPosition.setAll(0);
        this.closestToScreenCenterTarget = null;
        for (const cursor of this.targetCursors.values()) {
            cursor.dispose();
        }
        this.targetCursors.clear();
    }

    /** Explicit selection also supports assigned landing pads outside sensor range. */
    public setTarget(object: Transformable | null, forcedValue?: boolean): void {
        const target = object === null ? null : (this.getContact(object)?.target ?? null);
        let shouldHide = this.target === target;
        if (forcedValue !== undefined) {
            shouldHide = !forcedValue;
        }
        this.target = shouldHide ? null : target;
    }

    public getTarget(): Target | null {
        return this.target;
    }

    public getContact(object: Transformable): TargetContact | null {
        return this.targets.get(object.getTransform()) ?? null;
    }

    public setKnownTargets(objects: Iterable<Target>): void {
        this.knownTargets.clear();
        for (const object of objects) {
            if (this.targets.has(object.getTransform())) {
                this.knownTargets.add(object.getTransform());
            }
        }
    }

    public hasKnownOverride(object: Target): boolean {
        return this.knownTargets.has(object.getTransform());
    }

    public isKnown(object: Target): boolean {
        const contact = this.getContact(object);
        return contact !== null && (contact.acquisition === TargetAcquisition.KNOWN || this.hasKnownOverride(object));
    }

    /** Sensor detection uses the observer position from the latest update. */
    public isAvailable(object: Target): boolean {
        const contact = this.getContact(object);
        if (contact === null) {
            return false;
        }
        if (this.isKnown(object) || contact.target === this.target) {
            return true;
        }
        const transform = contact.target.getTransform();
        transform.computeWorldMatrix(true);
        const range = getSensorRange(contact.target);
        return Vector3.DistanceSquared(transform.getAbsolutePosition(), this.observerPosition) <= range * range;
    }

    public getClosestToScreenCenterTarget(): Target | null {
        return this.closestToScreenCenterTarget;
    }

    public update(camera: Camera, controlledObject: Transformable | null): void {
        if (!this.isEnabled()) {
            return;
        }
        camera.getViewMatrix();
        camera.getProjectionMatrix();
        const transformation = camera.getTransformationMatrix();
        const selected = this.target;
        const forward = camera.getDirection(Vector3.Forward(camera.getScene().useRightHandedSystem));
        const controlledTransform = controlledObject?.getTransform();
        const projected = Vector3.Zero();
        const frame = [...this.targetCursors].map(([target, cursor]) => {
            const isSelected = target === selected;
            const sensorRange = this.isKnown(target) || isSelected ? null : getSensorRange(target);
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
                isOnScreen && this.isAvailable(target)
                    ? getTargetCursorOpacity(target, distance, sensorRange, isSelected, this.hasKnownOverride(target))
                    : 0;
            return { target, cursor, opacity, projected: projected.clone(), isOnScreen };
        });
        let closest: Target | null = null;
        let closestDistanceSquared = Number.POSITIVE_INFINITY;
        for (const { target, opacity, projected: screenCoordinates, isOnScreen } of frame) {
            if (opacity <= 0 || !isOnScreen || target.getTransform() === controlledTransform) {
                continue;
            }
            const distanceSquared = (screenCoordinates.x - 0.5) ** 2 + (screenCoordinates.y - 0.5) ** 2;
            if (distanceSquared < closestDistanceSquared) {
                closestDistanceSquared = distanceSquared;
                closest = target;
            }
        }
        this.closestToScreenCenterTarget = closest;
        for (const { target, cursor, opacity } of frame) {
            cursor.setTarget(target === selected);
            cursor.setInformationEnabled(target === selected || target === this.closestToScreenCenterTarget);
            cursor.update(camera, opacity);
        }
    }

    public dispose(): void {
        this.setEnabled(false);
        for (const cursor of this.targetCursors.values()) {
            cursor.dispose();
        }
        this.targetCursors.clear();
        this.root.remove();
    }
}
