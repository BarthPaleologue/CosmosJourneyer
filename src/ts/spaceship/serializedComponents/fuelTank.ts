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

export const SerializedFuelTankSchema = z.object({
    type: z.literal("fuelTank"),
    size: z.number(),
    quality: z.number(),
    currentFuel01: z.number().min(0).max(1)
});

export type SerializedFuelTank = z.infer<typeof SerializedFuelTankSchema>;

export function getFuelTankSlot(size: number) {
    return SerializedFuelTankSchema.refine((tank) => tank.size === size).nullable();
}

export function getFuelTankSpecs(fuelTank: SerializedFuelTank) {
    return {
        maxFuel: 50 * (fuelTank.size + fuelTank.quality / 10)
    };
}

export class FuelTank {
    private currentFuel: number;
    private readonly maxFuel: number;

    readonly size: number;
    readonly quality: number;

    /**
     * Creates an empty fuel tank with the given maximum fuel capacity.
     * @param maxFuel The maximum fuel capacity of the tank.
     */
    constructor(serializedFuelTank: SerializedFuelTank) {
        const specs = getFuelTankSpecs(serializedFuelTank);
        this.maxFuel = specs.maxFuel;
        this.currentFuel = specs.maxFuel * serializedFuelTank.currentFuel01;

        this.size = serializedFuelTank.size;
        this.quality = serializedFuelTank.quality;
    }

    fill(amount: number): number {
        const fuelToAdd = Math.min(amount, this.maxFuel - this.currentFuel);
        this.currentFuel += fuelToAdd;
        return fuelToAdd;
    }

    burnFuel(amount: number): void {
        if (amount > this.currentFuel) {
            throw new Error("Not enough fuel in the tank.");
        }
        this.currentFuel -= amount;
    }

    getCurrentFuel() {
        return this.currentFuel;
    }

    getMaxFuel() {
        return this.maxFuel;
    }

    serialize(): SerializedFuelTank {
        return {
            type: "fuelTank",
            size: this.size,
            quality: this.quality,
            currentFuel01: this.currentFuel / this.maxFuel
        };
    }
}
