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

import { DiscoveryScanner } from "./components/discoveryScanner";
import { FuelScoop } from "./components/fuelScoop";
import { FuelTank } from "./components/fuelTank";
import { OptionalComponent } from "./components/optionalComponents";
import { Thrusters } from "./components/thrusters";
import { WarpDrive } from "./components/warpDrive";
import { ComponentSlot, OptionalComponentSlot } from "./componentSlot";
import { SerializedSpaceship, ShipType } from "./serializedSpaceship";

export class SpaceshipInternals {
    readonly type: ShipType;

    readonly primary: {
        warpDrive: ComponentSlot<["warpDrive"]>;
        thrusters: ComponentSlot<["thrusters"]>;
        fuelTank: ComponentSlot<["fuelTank"]>;
    };

    readonly optionals: ReadonlyArray<OptionalComponentSlot>;

    constructor(serializedSpaceShip: SerializedSpaceship) {
        this.type = serializedSpaceShip.type;

        const components = serializedSpaceShip.components;
        const primary = components.primary;
        const optionals = components.optional;
        switch (serializedSpaceShip.type) {
            case ShipType.WANDERER:
                this.primary = {
                    warpDrive: ComponentSlot.NewWarpDrive(3),
                    thrusters: ComponentSlot.NewThrusters(3),
                    fuelTank: ComponentSlot.NewFuelTank(2)
                };
                this.optionals = [
                    ComponentSlot.NewOptional(3),
                    ComponentSlot.NewOptional(2),
                    ComponentSlot.NewOptional(2)
                ];
                break;
        }

        this.primary.warpDrive.setComponent(primary.warpDrive !== null ? new WarpDrive(primary.warpDrive) : null);
        this.primary.thrusters.setComponent(primary.thrusters !== null ? new Thrusters(primary.thrusters) : null);
        this.primary.fuelTank.setComponent(primary.fuelTank !== null ? new FuelTank(primary.fuelTank) : null);

        for (let i = 0; i < optionals.length; i++) {
            const optional = optionals[i];
            if (optional === null) {
                this.optionals[i].setComponent(null);
                continue;
            }

            let component: OptionalComponent;
            switch (optional.type) {
                case "fuelTank":
                    component = new FuelTank(optional);
                    break;
                case "fuelScoop":
                    component = new FuelScoop(optional);
                    break;
                case "discoveryScanner":
                    component = new DiscoveryScanner(optional);
                    break;
            }

            this.optionals[i].setComponent(component);
        }
    }

    public getFuelTanks(): Array<FuelTank> {
        const fuelTanks: Array<FuelTank> = [];
        const mainFuelTank = this.primary.fuelTank.getComponent();
        if (mainFuelTank !== null) {
            fuelTanks.push(mainFuelTank);
        }
        fuelTanks.push(
            ...this.optionals
                .map((componentSlot) => componentSlot.getComponent())
                .filter((component) => component?.type === "fuelTank")
        );

        return fuelTanks;
    }

    public getFuelScoop(): FuelScoop | null {
        return (
            this.optionals
                .map((componentSlot) => componentSlot.getComponent())
                .find((component) => component?.type === "fuelScoop") ?? null
        );
    }

    public getDiscoveryScanner(): DiscoveryScanner | null {
        return (
            this.optionals
                .map((componentSlot) => componentSlot.getComponent())
                .find((component) => component?.type === "discoveryScanner") ?? null
        );
    }

    public getWarpDrive(): WarpDrive | null {
        return this.primary.warpDrive.getComponent();
    }

    public getThrusters(): Thrusters | null {
        return this.primary.thrusters.getComponent();
    }

    public serialize(): SerializedSpaceship["components"] {
        const primaryComponents = {
            warpDrive: this.getWarpDrive()?.serialize() ?? null,
            fuelTank: this.primary.fuelTank?.getComponent()?.serialize() ?? null,
            thrusters: this.getThrusters()?.serialize() ?? null
        };

        switch (this.type) {
            case ShipType.WANDERER:
                return {
                    primary: primaryComponents,
                    optional: [
                        this.optionals[0]?.getComponent()?.serialize() ?? null,
                        this.optionals[1]?.getComponent()?.serialize() ?? null,
                        this.optionals[2]?.getComponent()?.serialize() ?? null
                    ]
                };
        }
    }
}
