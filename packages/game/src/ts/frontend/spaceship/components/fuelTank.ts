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

import { getFuelTankSpecs, type SerializedFuelTank } from "@/backend/spaceship/serializedComponents/fuelTank";

export class FuelTank {
    readonly type;

    private currentFuel: number;
    private readonly maxFuel: number;

    readonly size: number;
    readonly quality: number;

    /**
     * Creates a fuel tank based on serialized data.
     * @param serializedFuelTank The serialized specification of the fuel tank.
     */
    constructor(serializedFuelTank: SerializedFuelTank) {
        this.type = serializedFuelTank.type;

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
            currentFuel01: this.currentFuel / this.maxFuel,
        };
    }
}
