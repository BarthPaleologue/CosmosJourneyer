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

import type { OrbitalObject } from "@/frontend/universe/architecture/orbitalObject";

import { isInsideRingRadialBounds, isPositionInsideRingVolume, projectPositionOnRingPlane } from "@/utils/ringVolume";

import type { Altimeter } from "../altimeter";

export function canEngageWarpDrive(
    shipTransform: TransformNode,
    shipAltimeter: Altimeter,
    currentVelocity: number,
    nearestOrbitalObject: OrbitalObject,
): boolean {
    const shipPosition = shipTransform.getAbsolutePosition();
    const nearestObjectPosition = nearestOrbitalObject.getTransform().getAbsolutePosition();

    const distanceToObjectCenter = Vector3.Distance(shipPosition, nearestObjectPosition);

    const altimeterDistance = shipAltimeter.getAltitude();
    const roughDistance = distanceToObjectCenter - nearestOrbitalObject.getBoundingRadius();
    const distanceToObject = altimeterDistance !== null ? Math.min(altimeterDistance, roughDistance) : roughDistance;

    const emergencyMargin = 0.03 * nearestOrbitalObject.getBoundingRadius();
    if (distanceToObject <= emergencyMargin) {
        return false;
    }

    const shipForward = shipTransform.forward;
    const directionToObject = nearestObjectPosition.subtract(shipPosition).normalize();

    const nbSecondsPrediction = 0.3;
    const predictedTraveledDistance = currentVelocity * nbSecondsPrediction;
    const predictedDistanceToObject = distanceToObject - predictedTraveledDistance; // worst case scenario
    const willBeTooClose = predictedDistanceToObject < emergencyMargin;
    const isGettingCloser = shipForward.dot(directionToObject) > 0;
    if (willBeTooClose && isGettingCloser) {
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

    const predictedPosition = shipPosition.add(shipForward.scale(predictedTraveledDistance));

    const ringVolume = asteroidField.getRingVolume();
    const ringProjection = projectPositionOnRingPlane(shipPosition, ringVolume);
    const nextRingProjection = projectPositionOnRingPlane(predictedPosition, ringVolume);
    const isAboveRing = isInsideRingRadialBounds(ringProjection.planarDistance, ringVolume);
    const willBeAboveRing = isInsideRingRadialBounds(nextRingProjection.planarDistance, ringVolume);
    const isInRing = isPositionInsideRingVolume(shipPosition, ringVolume);
    const willCrossRing =
        Math.sign(ringProjection.signedHeight) !== Math.sign(nextRingProjection.signedHeight) &&
        (willBeAboveRing || isAboveRing);

    if (isInRing || willCrossRing) {
        return false;
    }

    return true;
}
