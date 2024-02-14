//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { BoundingSphere } from "../architecture/boundingSphere";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CelestialBody } from "../architecture/celestialBody";
import { Transformable } from "../architecture/transformable";

export function nearestBody(objectPosition: Vector3, bodies: CelestialBody[]): CelestialBody {
    let distance = -1;
    if (bodies.length === 0) throw new Error("no bodieees !");
    let nearest = bodies[0];
    for (const body of bodies) {
        const newDistance = objectPosition.subtract(body.getTransform().getAbsolutePosition()).length();
        if (distance === -1 || newDistance < distance) {
            nearest = body;
            distance = newDistance;
        }
    }
    return nearest;
}

/**
 * If the parameter is unset, returns whereas the player is orbiting a body, if the parameter is set returns if the player orbits the given body
 * @param controller the controller to check
 * @param body the body to check whereas the player is orbiting
 * @param orbitLimitFactor the boundary of the orbit detection (multiplied by planet radius)
 */
export function isOrbiting(controller: Transformable, body: Transformable & BoundingSphere, orbitLimitFactor = 2.5): boolean {
    return Vector3.DistanceSquared(body.getTransform().getAbsolutePosition(), controller.getTransform().getAbsolutePosition()) < (orbitLimitFactor * body.getBoundingRadius()) ** 2;
}
