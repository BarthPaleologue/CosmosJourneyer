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

import type { SystemContentModel } from "@/backend/systemEntity/systemEntityModel";

export const PrimaryMirrorModelSchema = z
    .object({
        apertureRadius: z.number().positive(),
        shape: z.object({
            focalLength: z.number().positive(),
            conicConstant: z.number(),
        }),
        segmentation: z.object({
            tileRadius: z.number().positive(),
            gap: z.number().nonnegative(),
        }),
    })
    .refine(
        (model) => model.apertureRadius >= Math.sqrt(3) * model.segmentation.tileRadius + model.segmentation.gap,
        "The aperture must contain at least one ring of segments",
    )
    .refine((model) => {
        const radiusOfCurvature = 2 * model.shape.focalLength;
        const outerRadius = model.apertureRadius + model.segmentation.tileRadius;
        return 1 - (1 + model.shape.conicConstant) * (outerRadius / radiusOfCurvature) ** 2 > 0;
    }, "The conic must have finite normals across the entire mirror");

export type PrimaryMirrorModel = z.infer<typeof PrimaryMirrorModelSchema>;

export const SpaceTelescopeModelSchema = z.object({
    type: z.literal("spaceTelescope"),
    primaryMirror: PrimaryMirrorModelSchema,
    heatShield: z.object({
        size: z.number().positive(),
        count: z.number().int().positive(),
        spacing: z.number().positive(),
        distance: z.number().positive(),
    }),
});

export type SpaceTelescopeModel = z.infer<typeof SpaceTelescopeModelSchema> & SystemContentModel<"spaceTelescope">;

/** Historical optical parameters with scaled-down heat shields. */
export function createSpaceTelescopeModel(): SpaceTelescopeModel {
    return {
        type: "spaceTelescope",
        primaryMirror: {
            apertureRadius: 20.25,
            shape: { focalLength: 15, conicConstant: -0.9967 },
            segmentation: { tileRadius: 0.75, gap: 0.07 },
        },
        heatShield: { size: 100, count: 7, spacing: 5, distance: 45 },
    };
}
