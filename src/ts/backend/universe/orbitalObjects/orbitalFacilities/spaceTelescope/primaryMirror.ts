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

export const ConicShapeSchema = z.object({
    type: z.literal("conic"),
    focalLength: z.number().positive(),

    /**
     * The conic constant (K) defines the type of conic section:
     * - K = -1: Parabola
     * - K < -1: Hyperbola
     * - -1 < K < 0: Ellipse
     * - K = 0: Sphere (not allowed for primary mirrors in this context)
     *
     * In practice, primary mirrors are often parabolic (K = -1) to focus parallel rays to a single point.
     * @see https://en.wikipedia.org/wiki/Conic_constant
     */
    conicConstant: z.number().max(0).default(-1),
});

export const HexagonTilingSchema = z.object({
    type: z.literal("hexagonTiling"),
    tileRadius: z.number().positive(),
    gap: z.number().min(0),
});

export const PrimaryMirrorModelSchema = z.object({
    apertureRadius: z.number().positive(),
    shape: ConicShapeSchema,
    segmentation: HexagonTilingSchema,
});

export type PrimaryMirrorModel = z.infer<typeof PrimaryMirrorModelSchema>;
