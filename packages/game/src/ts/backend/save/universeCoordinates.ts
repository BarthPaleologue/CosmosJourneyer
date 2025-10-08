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

import { UniverseObjectIdSchema } from "@/backend/universe/universeObjectId";

export const RelativeCoordinatesSchema = z.object({
    type: z.literal("relative"),

    /**
     * The coordinates of the body in the universe.
     */
    universeObjectId: UniverseObjectIdSchema,

    /**
     * The position in the object's frame of reference.
     */
    position: z.object({
        x: z.number().default(0),
        y: z.number().default(0),
        z: z.number().default(0),
    }),

    /**
     * The rotation quaternion in the object's frame of reference.
     */
    rotation: z.object({
        x: z.number().default(0),
        y: z.number().default(0),
        z: z.number().default(0),
        w: z.number().default(1),
    }),
});

export type RelativeCoordinates = z.infer<typeof RelativeCoordinatesSchema>;

export const AtStationCoordinatesSchema = z.object({
    type: z.literal("atStation"),

    universeObjectId: UniverseObjectIdSchema,
});

export type AtStationCoordinates = z.infer<typeof AtStationCoordinatesSchema>;

export const OnSurfaceCoordinatesSchema = z.object({
    type: z.literal("onSurface"),

    universeObjectId: UniverseObjectIdSchema,

    latitude: z.number().default(0),

    longitude: z.number().default(0),
});

export type OnSurfaceCoordinates = z.infer<typeof OnSurfaceCoordinatesSchema>;

export const InSpaceshipCoordinatesSchema = z.object({
    type: z.literal("inSpaceship"),

    shipId: z.uuid(),
});

export type InSpaceshipCoordinates = z.infer<typeof InSpaceshipCoordinatesSchema>;

export const UniverseCoordinatesSchema = z.discriminatedUnion("type", [
    RelativeCoordinatesSchema,
    AtStationCoordinatesSchema,
    OnSurfaceCoordinatesSchema,
    InSpaceshipCoordinatesSchema,
]);

export type UniverseCoordinates = z.infer<typeof UniverseCoordinatesSchema>;
