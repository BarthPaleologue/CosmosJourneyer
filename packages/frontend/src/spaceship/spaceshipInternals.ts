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

import { type SerializedComponent } from "@/backend/spaceship/serializedComponents/component";
import { type SerializedOptionalComponent } from "@/backend/spaceship/serializedComponents/optionalComponents";
import { ShipType, type SerializedSpaceship } from "@/backend/spaceship/serializedSpaceship";

import type { DeepReadonly } from "@/utils/types";

import { DiscoveryScanner } from "./components/discoveryScanner";
import { FuelScoop } from "./components/fuelScoop";
import { FuelTank } from "./components/fuelTank";
import { type OptionalComponent } from "./components/optionalComponents";
import { Thrusters } from "./components/thrusters";
import { WarpDrive } from "./components/warpDrive";
import { ComponentSlot } from "./componentSlot";

export class SpaceshipInternals {
    readonly type: ShipType;

    readonly primary: Readonly<{
        warpDrive: ComponentSlot;
        thrusters: ComponentSlot;
        fuelTank: ComponentSlot;
    }>;

    readonly optionals: ReadonlyArray<ComponentSlot>;

    constructor(serializedSpaceship: DeepReadonly<SerializedSpaceship>, unfitComponents: Set<SerializedComponent>) {
        this.type = serializedSpaceship.type;

        const components = serializedSpaceship.components;
        const primary = components.primary;
        const optionals = components.optional;
        switch (serializedSpaceship.type) {
            case ShipType.WANDERER:
                this.primary = {
                    warpDrive: ComponentSlot.NewWarpDrive(3),
                    thrusters: ComponentSlot.NewThrusters(3),
                    fuelTank: ComponentSlot.NewFuelTank(2),
                };
                this.optionals = [
                    ComponentSlot.NewOptional(3),
                    ComponentSlot.NewOptional(2),
                    ComponentSlot.NewOptional(2),
                ];
                break;
        }

        if (primary.warpDrive !== null) {
            const success = this.primary.warpDrive.setComponent(new WarpDrive(primary.warpDrive));
            if (!success) {
                unfitComponents.add(primary.warpDrive);
            }
        }

        if (primary.thrusters !== null) {
            const success = this.primary.thrusters.setComponent(new Thrusters(primary.thrusters));
            if (!success) {
                unfitComponents.add(primary.thrusters);
            }
        }

        if (primary.fuelTank !== null) {
            const success = this.primary.fuelTank.setComponent(new FuelTank(primary.fuelTank));
            if (!success) {
                unfitComponents.add(primary.fuelTank);
            }
        }

        for (let i = 0; i < optionals.length; i++) {
            const optional = optionals[i];
            const slot = this.optionals[i];
            if (slot === undefined) {
                console.error("Invalid optional component slot");
                continue;
            }
            if (optional === null || optional === undefined) {
                slot.setComponent(null);
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

            const success = slot.setComponent(component);
            if (!success) {
                unfitComponents.add(optional);
            }
        }
    }

    public getFuelTanks(): Array<FuelTank> {
        const fuelTanks: Array<FuelTank> = [];
        const mainFuelTank = this.primary.fuelTank.getComponent();
        if (mainFuelTank !== null && mainFuelTank.type === "fuelTank") {
            fuelTanks.push(mainFuelTank);
        }
        fuelTanks.push(
            ...this.optionals
                .map((componentSlot) => componentSlot.getComponent())
                .filter((component) => component?.type === "fuelTank"),
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
        const warpDrive = this.primary.warpDrive.getComponent();
        if (warpDrive === null || warpDrive.type !== "warpDrive") {
            return null;
        }

        return warpDrive;
    }

    public getThrusters(): Thrusters | null {
        const thrusters = this.primary.thrusters.getComponent();
        if (thrusters === null || thrusters.type !== "thrusters") {
            return null;
        }

        return thrusters;
    }

    public serialize(): SerializedSpaceship["components"] {
        const primaryComponents = {
            warpDrive: this.getWarpDrive()?.serialize() ?? null,
            fuelTank: this.getFuelTanks().at(0)?.serialize() ?? null,
            thrusters: this.getThrusters()?.serialize() ?? null,
        };

        const optionals: ReadonlyArray<SerializedOptionalComponent | null> = this.optionals
            .map((componentSlot) => componentSlot.getComponent()?.serialize() ?? null)
            .filter(
                (component) =>
                    component === null ||
                    component?.type === "discoveryScanner" ||
                    component?.type === "fuelTank" ||
                    component?.type === "fuelScoop",
            );

        switch (this.type) {
            case ShipType.WANDERER:
                if (optionals[0] === undefined || optionals[1] === undefined || optionals[2] === undefined) {
                    throw new Error("Optional components are undefined");
                }
                return {
                    primary: primaryComponents,
                    optional: [optionals[0], optionals[1], optionals[2]],
                };
        }
    }
}
