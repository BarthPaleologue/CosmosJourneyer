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

import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type OrbitalObjectId } from "@cosmos-journeyer/universe-model";

import { getPointOnOrbitLocal } from "@/frontend/helpers/orbit";

import { type OrbitalObject } from "./architecture/orbitalObject";

export type OrbitalTransform = {
    readonly position: Vector3;
    readonly orientation: Quaternion;
};

export type RelativeTransformFrame = "reference" | "inertial";

/**
 * Responsible for computing orbital positions and orientations of objects based on Kepler's laws of planetary motion.
 */
export class KeplerianOrbitalSimulation {
    private readonly objectsById = new Map<OrbitalObjectId, OrbitalObject>();
    private readonly objectToParents = new Map<OrbitalObject, ReadonlyArray<OrbitalObject>>();
    private readonly initialPositions = new Map<OrbitalObject, Vector3>();
    private readonly transformCache = new Map<OrbitalObject, OrbitalTransform>();

    private elapsedSeconds = 0;

    public constructor(orbitalObjects: ReadonlyArray<OrbitalObject>) {
        for (const object of orbitalObjects) {
            this.objectsById.set(object.model.id, object);
            this.initialPositions.set(object, object.getTransform().position.clone());
        }

        for (const object of orbitalObjects) {
            this.objectToParents.set(
                object,
                object.model.orbit.parentIds
                    .map((parentId) => {
                        const parent = this.objectsById.get(parentId);
                        if (parent === undefined) {
                            console.error(`Parent ${parentId} of ${object.model.name} is not defined`);
                        }
                        return parent;
                    })
                    .filter((parent) => parent !== undefined),
            );
        }
    }

    public update(elapsedSeconds: number): void {
        this.elapsedSeconds = elapsedSeconds;
        this.transformCache.clear();
    }

    public getTransform(objectId: OrbitalObjectId): OrbitalTransform | undefined {
        const object = this.objectsById.get(objectId);
        if (object === undefined) {
            return undefined;
        }

        return this.getTransformFromObject(object);
    }

    /**
     * Computes the transform of an object relative to another object.
     * @param objectId The object whose transform is returned.
     * @param referenceObjectId The object used as the local origin.
     * @param frame "reference" expresses the result in the reference object's rotating frame; "inertial" only subtracts the reference position.
     */
    public getRelativeTransform(
        objectId: OrbitalObjectId,
        referenceObjectId: OrbitalObjectId,
        frame: RelativeTransformFrame,
    ): OrbitalTransform | undefined {
        const transform = this.getTransform(objectId);
        const referenceTransform = this.getTransform(referenceObjectId);

        if (transform === undefined || referenceTransform === undefined) {
            return undefined;
        }

        if (frame === "inertial") {
            return {
                position: transform.position.subtract(referenceTransform.position),
                orientation: transform.orientation,
            };
        }

        const inverseReferenceOrientation = referenceTransform.orientation.conjugate();
        const relativePosition = transform.position
            .subtract(referenceTransform.position)
            .applyRotationQuaternion(inverseReferenceOrientation);
        const relativeOrientation = inverseReferenceOrientation.multiply(transform.orientation);

        return {
            position: relativePosition,
            orientation: relativeOrientation,
        };
    }

    private getTransformFromObject(object: OrbitalObject): OrbitalTransform {
        const cachedTransform = this.transformCache.get(object);
        if (cachedTransform !== undefined) {
            return cachedTransform;
        }

        const transform = {
            position: this.computeAbsolutePosition(object),
            orientation: this.computeAbsoluteOrientation(object),
        };
        this.transformCache.set(object, transform);

        return transform;
    }

    private computeAbsolutePosition(object: OrbitalObject): Vector3 {
        const parents = this.objectToParents.get(object);
        if (parents === undefined) {
            return object.getTransform().position.clone();
        }

        const orbit = object.model.orbit;
        if (orbit.semiMajorAxis === 0 || parents.length === 0) {
            const initialPosition = this.initialPositions.get(object);
            if (initialPosition === undefined) {
                return object.getTransform().position.clone();
            }
            return initialPosition.clone();
        }

        const barycenter = Vector3.Zero();
        let sumOfMasses = 0;
        for (const parent of parents) {
            const parentTransform = this.getTransformFromObject(parent);
            const parentMass = parent.model.mass;
            barycenter.addInPlace(parentTransform.position.scale(parentMass));
            sumOfMasses += parentMass;
        }
        if (sumOfMasses === 0) {
            const initialPosition = this.initialPositions.get(object);
            return initialPosition?.clone() ?? object.getTransform().position.clone();
        }
        barycenter.scaleInPlace(1 / sumOfMasses);

        return getPointOnOrbitLocal(orbit, sumOfMasses, this.elapsedSeconds).addInPlace(barycenter);
    }

    private computeAbsoluteOrientation(object: OrbitalObject): Quaternion {
        const orientation = Quaternion.RotationAxis(Axis.Z, object.model.orbit.inclination + object.model.axialTilt);

        if (object.model.siderealDaySeconds === 0) {
            return orientation;
        }

        const rotationAroundAxis = (2 * Math.PI * this.elapsedSeconds) / object.model.siderealDaySeconds;
        return orientation.multiply(Quaternion.RotationAxis(Axis.Y, rotationAroundAxis));
    }
}
