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
import { getFuelTankSlot, SerializedFuelTankSchema } from "./serializedComponents/fuelTank";
import { getOptionalComponentSlot, SerializedOptionalComponentSchema } from "./serializedComponents/optionalComponents";
import { getWarpDriveSlot, SerializedWarpDriveSchema } from "./serializedComponents/warpDrive";
import { getThrustersSlot, SerializedThrustersSchema } from "./serializedComponents/thrusters";

export enum ShipType {
    WANDERER = "WANDERER"
}

export const BaseSpaceshipSchema = z.object({
    type: z.nativeEnum(ShipType).default(ShipType.WANDERER),
    id: z.string().uuid(),
    name: z.string(),
    components: z.object({
        primary: z.object({
            warpDrive: SerializedWarpDriveSchema,
            thrusters: SerializedThrustersSchema,
            fuelTank: SerializedFuelTankSchema
        }),
        optional: z.array(SerializedOptionalComponentSchema)
    })
});

export const WandererSchema = BaseSpaceshipSchema.extend({
    type: z.literal(ShipType.WANDERER),
    components: z.object({
        primary: z.object({
            warpDrive: getWarpDriveSlot(3),
            thrusters: getThrustersSlot(3),
            fuelTank: getFuelTankSlot(2)
        }),
        optional: z.tuple([getOptionalComponentSlot(3), getOptionalComponentSlot(2), getOptionalComponentSlot(2)])
    })
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
                    quality: 1
                },
                thrusters: {
                    type: "thrusters",
                    size: 3,
                    quality: 1
                },
                fuelTank: {
                    type: "fuelTank",
                    size: 2,
                    quality: 1,
                    currentFuel01: 1
                }
            },
            optional: [
                null,
                {
                    type: "fuelScoop",
                    size: 2,
                    quality: 1
                },
                null
            ]
        }
    } satisfies SerializedSpaceship);
}
