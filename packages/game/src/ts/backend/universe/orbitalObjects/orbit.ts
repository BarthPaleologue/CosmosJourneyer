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

import { z } from "zod";

import { OrbitalObjectIdSchema } from "./orbitalObjectId";

/**
 * Represents an orbit in the p-norm space. (Euclidean space for p=2)
 * @see https://en.wikipedia.org/wiki/Orbital_elements
 */
export const OrbitSchema = z.object({
    /**
     * References to the parent bodies
     */
    parentIds: z.array(OrbitalObjectIdSchema),

    /**
     * Half the distance between the apoapsis and periapsis
     */
    semiMajorAxis: z.number(),

    /**
     * Shape of the ellipse, describing how much it is elongated compared to a circle
     */
    eccentricity: z.number().default(0),

    /**
     * Vertical tilt of the ellipse with respect to the reference plane, measured at the ascending node
     */
    inclination: z.number().default(0),

    /**
     * horizontally orients the ascending node of the ellipse (where the orbit passes from south to north through the reference plane)
     * with respect to the reference frame's vernal point.
     */
    longitudeOfAscendingNode: z.number().default(0),

    /**
     * Defines the orientation of the ellipse in the orbital plane, as an angle measured from the ascending node to the periapsis
     */
    argumentOfPeriapsis: z.number().default(0),

    /**
     * The mean anomaly at t=0
     *
     * The mean anomaly M is a mathematically convenient fictitious "angle" which does not correspond to a real geometric angle,
     * but rather varies linearly with time, one whole orbital period being represented by an "angle" of 2π radians.
     * It can be converted into the true anomaly ν, which does represent the real geometric angle in the plane of the ellipse,
     * between periapsis (closest approach to the central body) and the position of the orbiting body at any given time
     */
    initialMeanAnomaly: z.number().default(0),

    /**
     * The norm to use for the orbit. 2 for Euclidean space, other numbers for funky shapes.
     * @see https://medium.com/@barth_29567/crazy-orbits-lets-make-squares-c91a427c6b26
     */
    p: z.number().default(2),
});

export type Orbit = z.infer<typeof OrbitSchema>;
