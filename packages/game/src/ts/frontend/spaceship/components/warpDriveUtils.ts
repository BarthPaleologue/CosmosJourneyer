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
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { type OrbitalObject } from "@/frontend/universe/architecture/orbitalObject";

export function canEngageWarpDrive(
    shipTransform: TransformNode,
    currentVelocity: number,
    nearestOrbitalObject: OrbitalObject,
) {
    const shipPosition = shipTransform.getAbsolutePosition();
    const distanceToObject = Vector3.Distance(shipPosition, nearestOrbitalObject.getTransform().getAbsolutePosition());
    const emergencyStopDistance = nearestOrbitalObject.getBoundingRadius() * 1.05;
    if (distanceToObject < emergencyStopDistance) {
        return false;
    }

    if (
        nearestOrbitalObject.type !== "gasPlanet" &&
        nearestOrbitalObject.type !== "telluricPlanet" &&
        nearestOrbitalObject.type !== "star" &&
        nearestOrbitalObject.type !== "neutronStar"
    ) {
        return true;
    }

    // if the spaceship goes too close to planetary rings, stop the warp drive to avoid collision with asteroids
    const asteroidField = nearestOrbitalObject.asteroidField;
    if (asteroidField === null) {
        return true;
    }

    const inverseWorld = nearestOrbitalObject.getTransform().getWorldMatrix().clone().invert();
    const relativePosition = Vector3.TransformCoordinates(shipPosition, inverseWorld);
    const relativeForward = Vector3.TransformNormal(
        shipTransform.getDirection(Vector3.Forward(shipTransform.getScene().useRightHandedSystem)),
        inverseWorld,
    );
    const distanceAboveRings = relativePosition.y;
    const planarDistance = Math.sqrt(relativePosition.x * relativePosition.x + relativePosition.z * relativePosition.z);

    const nbSecondsPrediction = 0.5;
    const nextRelativePosition = relativePosition.add(relativeForward.scale(currentVelocity * nbSecondsPrediction));
    const nextDistanceAboveRings = nextRelativePosition.y;
    const nextPlanarDistance = Math.sqrt(
        nextRelativePosition.x * nextRelativePosition.x + nextRelativePosition.z * nextRelativePosition.z,
    );

    const ringsMinDistance = asteroidField.innerRadius;
    const ringsMaxDistance = asteroidField.outerRadius;

    const isAboveRing = planarDistance > ringsMinDistance && planarDistance < ringsMaxDistance;
    const willBeAboveRing = nextPlanarDistance > ringsMinDistance && nextPlanarDistance < ringsMaxDistance;

    const isInRing = Math.abs(distanceAboveRings) < asteroidField.patchThickness / 2 && isAboveRing;
    const willCrossRing =
        Math.sign(distanceAboveRings) !== Math.sign(nextDistanceAboveRings) && (willBeAboveRing || isAboveRing);

    if (isInRing || willCrossRing) {
        return false;
    }

    return true;
}
