//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

export const RotationSchema = z.object({
    /**
     * The angle between the planet's spin axis and its orbital axis (in radians)
     * @see https://en.wikipedia.org/wiki/Axial_tilt
     */
    axialTilt: z.number(),

    /** The azimuth of the planet's spin axis (in radians) */
    spinAxisAzimuth: z.number(),

    /**
     * Time needed for the object to rotate 360° on its axis in seconds.
     * It is slightly different from the duration of solar day
     * which is the time it takes for the sun to be at the same position in the sky.
     * @see https://en.wikipedia.org/wiki/Sidereal_time
     */
    siderealPeriod: z.number(),

    /** The initial rotation angle of the planet (in radians) */
    initialRotationAngle: z.number(),
});

export type Rotation = z.infer<typeof RotationSchema>;
