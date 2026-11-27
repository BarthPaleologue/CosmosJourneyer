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
import { Vector3 } from "@babylonjs/core/Maths/math";
import { radians } from "@cosmos-journeyer/physics";
import type { Meters, Radians } from "@cosmos-journeyer/physics";

import type { HasBoundingSphere } from "@/frontend/universe/architecture/hasBoundingSphere";
import type { Transformable } from "@/frontend/universe/architecture/transformable";

export const DefaultMinProjectedDiameter = 0.005;

/**
 * @param position - Object position in world space.
 * @param radius - Object bounding radius in world units.
 * @param cameraPosition - Camera position in the same frame as the object.
 * @param fov - Camera field of view in radians.
 * @returns Angular diameter divided by `fov`, or infinity when inside the sphere.
 */
export function getProjectedDiameter01(
    position: Vector3,
    radius: Meters,
    cameraPosition: Vector3,
    fov: Radians,
): number {
    const distance = Vector3.Distance(position, cameraPosition);
    if (distance <= radius) {
        return Number.POSITIVE_INFINITY;
    }

    const angularDiameter = 2 * Math.atan(radius / distance);
    return angularDiameter / fov;
}

export type SizeOnScreenOptions = Partial<{
    threshold: number;
}>;

/**
 * @param object - Object whose projected size is measured.
 * @param camera - Camera used for the projection.
 * @param options - Optional knobs; `threshold` is the minimum projected diameter as a fraction of the field of view.
 * @returns Whether the projected diameter exceeds the threshold.
 */
export function isSizeOnScreenEnough(
    object: HasBoundingSphere & Transformable,
    camera: Camera,
    options?: SizeOnScreenOptions,
): boolean {
    const threshold = options?.threshold ?? DefaultMinProjectedDiameter;
    const angularSize = getProjectedDiameter01(
        object.getTransform().getAbsolutePosition(),
        object.getBoundingRadius(),
        camera.globalPosition,
        radians(camera.fov),
    );

    return angularSize > threshold;
}
