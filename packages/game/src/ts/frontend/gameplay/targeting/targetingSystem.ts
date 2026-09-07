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
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Observable } from "@babylonjs/core/Misc/observable";

import type { Transformable } from "../../simulation/architecture/transformable";
import type { Target } from "./target";
import { TargetAcquisition } from "./targetContact";
import type { TargetContact } from "./targetContact";

export const sensorRangeFactor = 100;

export function getSensorRange(target: Target): number {
    return target.getBoundingRadius() * sensorRangeFactor;
}

export class TargetingSystem {
    readonly onTargetsAddedObservable = new Observable<Iterable<Target>>();
    readonly onTargetsRemovedObservable = new Observable<Iterable<Target>>();

    private readonly targets = new Map<TransformNode, TargetContact>();
    private target: Target | null = null;
    private readonly knownTargets = new Set<TransformNode>();
    private readonly observerPosition = Vector3.Zero();

    public *getTargets(): Iterable<Target> {
        for (const contact of this.targets.values()) {
            yield contact.target;
        }
    }

    public addContacts(contacts: Iterable<TargetContact>): void {
        const added: Array<Target> = [];
        for (const contact of contacts) {
            const object = contact.target;
            const transform = object.getTransform();
            if (!this.targets.has(transform)) {
                this.targets.set(transform, contact);
                added.push(object);
            }
        }
        if (added.length > 0) {
            this.onTargetsAddedObservable.notifyObservers(added);
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
        this.onTargetsRemovedObservable.notifyObservers([target]);
    }

    /** Updates the observer position used by sensor acquisition, independently of any UI. */
    public update(observerPosition: Vector3): void {
        this.observerPosition.copyFrom(observerPosition);
    }

    public reset(): void {
        const removed = [...this.getTargets()];
        this.targets.clear();
        this.target = null;
        this.knownTargets.clear();
        this.observerPosition.setAll(0);
        if (removed.length > 0) {
            this.onTargetsRemovedObservable.notifyObservers(removed);
        }
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
}
