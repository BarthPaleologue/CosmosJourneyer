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

export function rayIntersectSphere(rayOrigin: Vector3, rayDir: Vector3, spherePosition: Vector3, sphereRadius: number): [boolean, number, number] {
    const relativeOrigin = rayOrigin.subtract(spherePosition); // rayOrigin in sphere space

    const a = 1.0;
    const b = 2.0 * Vector3.Dot(relativeOrigin, rayDir);
    const c = Vector3.Dot(relativeOrigin, relativeOrigin) - sphereRadius ** 2;

    const d = b * b - 4.0 * a * c;

    if (d < 0.0) return [false, 0, 0]; // no intersection

    const s = Math.sqrt(d);

    const r0 = (-b - s) / (2.0 * a);
    const r1 = (-b + s) / (2.0 * a);

    const t0 = Math.max(Math.min(r0, r1), 0.0);
    const t1 = Math.max(Math.max(r0, r1), 0.0);

    return [t1 > 0.0, t0, t1];
}
