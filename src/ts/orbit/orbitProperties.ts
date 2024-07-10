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

import { Vector3 } from "@babylonjs/core/Maths/math";

interface OrbitProps {
    radius: number;
    p: number;
    period: number;
    normalToPlane: Vector3;
    isPlaneAlignedWithParent: boolean;
}

export class OrbitProperties {
    radius: number;

    readonly p: number;

    /**
     * The duration it takes for the body to make one orbit
     */
    period: number;

    /**
     * The orientation of the orbit (inclination + precession)
     */
    normalToPlane: Vector3;

    /**
     * Whether the orbital plane is aligned with the parent body or not (allows to see rings from satellites when false)
     */
    readonly isPlaneAlignedWithParent: boolean;

    constructor({ radius, p, period, normalToPlane, isPlaneAlignedWithParent }: OrbitProps) {
        this.radius = radius;
        this.p = p;
        this.period = period;
        this.normalToPlane = normalToPlane;
        this.isPlaneAlignedWithParent = isPlaneAlignedWithParent;
    }
}
