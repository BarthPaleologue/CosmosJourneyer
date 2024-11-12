export type SerializedFuelTank = {
    currentFuel: number;
    readonly maxFuel: number;
};

export class FuelTank {
    private currentFuel: number;
    private readonly maxFuel: number;

    /**
     * Creates an empty fuel tank with the given maximum fuel capacity.
     * @param maxFuel The maximum fuel capacity of the tank.
     */
    constructor(maxFuel: number) {
        this.currentFuel = 0;
        this.maxFuel = maxFuel;
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
            currentFuel: this.currentFuel,
            maxFuel: this.maxFuel
        };
    }

    static Deserialize(serializedFuelTank: SerializedFuelTank): FuelTank {
        const fuelTank = new FuelTank(serializedFuelTank.maxFuel);
        fuelTank.currentFuel = serializedFuelTank.currentFuel;
        return fuelTank;
    }
}
