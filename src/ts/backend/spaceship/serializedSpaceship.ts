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

import { SerializedFuelTankSchema } from "../../frontend/spaceship/serializedComponents/fuelTank";
import { SerializedOptionalComponentSchema } from "../../frontend/spaceship/serializedComponents/optionalComponents";
import { SerializedThrustersSchema } from "../../frontend/spaceship/serializedComponents/thrusters";
import { SerializedWarpDriveSchema } from "../../frontend/spaceship/serializedComponents/warpDrive";

export enum ShipType {
    WANDERER = "WANDERER",
}

export const BaseSpaceshipSchema = z.object({
    type: z.nativeEnum(ShipType).default(ShipType.WANDERER),
    id: z.string().uuid(),
    name: z.string(),
    components: z.object({
        primary: z.object({
            warpDrive: SerializedWarpDriveSchema,
            thrusters: SerializedThrustersSchema,
            fuelTank: SerializedFuelTankSchema,
        }),
        optional: z.array(SerializedOptionalComponentSchema),
    }),
});

export const WandererSchema = BaseSpaceshipSchema.extend({
    type: z.literal(ShipType.WANDERER),
    components: z.object({
        primary: z.object({
            warpDrive: SerializedWarpDriveSchema.nullable(),
            thrusters: SerializedThrustersSchema.nullable(),
            fuelTank: SerializedFuelTankSchema.nullable(),
        }),
        optional: z.tuple([
            SerializedOptionalComponentSchema.nullable(),
            SerializedOptionalComponentSchema.nullable(),
            SerializedOptionalComponentSchema.nullable(),
        ]),
    }),
});

export type SerializedWanderer = z.infer<typeof WandererSchema>;

export const SerializedSpaceshipSchema = z.discriminatedUnion("type", [WandererSchema]);

export type SerializedSpaceship = z.infer<typeof SerializedSpaceshipSchema>;

export function getDefaultSerializedSpaceship(): SerializedSpaceship {
    return WandererSchema.parse({
        type: ShipType.WANDERER,
        name: "Wanderer",
        id: crypto.randomUUID(),
        components: {
            primary: {
                warpDrive: {
                    type: "warpDrive",
                    size: 3,
                    quality: 1,
                },
                thrusters: {
                    type: "thrusters",
                    size: 3,
                    quality: 1,
                },
                fuelTank: {
                    type: "fuelTank",
                    size: 2,
                    quality: 1,
                    currentFuel01: 1,
                },
            },
            optional: [
                null,
                {
                    type: "fuelScoop",
                    size: 2,
                    quality: 1,
                },
                {
                    type: "discoveryScanner",
                    size: 2,
                    quality: 1,
                },
            ],
        },
    } satisfies SerializedSpaceship);
}
