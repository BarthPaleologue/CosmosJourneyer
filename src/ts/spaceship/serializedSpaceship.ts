import { z } from "zod";
import { SerializedFuelScoopSchema } from "./fuelScoop";
import { SerializedFuelTankSchema } from "./fuelTank";

export enum ShipType {
    WANDERER
}

export const SerializedSpaceshipSchema = z.object({
    id: z.string().default(() => crypto.randomUUID()),
    name: z.string().default("Wanderer"),
    type: z.nativeEnum(ShipType).default(ShipType.WANDERER),
    fuelTanks: z.array(SerializedFuelTankSchema).default([{ currentFuel: 100, maxFuel: 100 }]),
    fuelScoop: z.nullable(SerializedFuelScoopSchema).nullable().default({ fuelPerSecond: 2.5 })
});

export type SerializedSpaceship = z.infer<typeof SerializedSpaceshipSchema>;

export const DefaultSerializedSpaceship: SerializedSpaceship = SerializedSpaceshipSchema.parse({});
