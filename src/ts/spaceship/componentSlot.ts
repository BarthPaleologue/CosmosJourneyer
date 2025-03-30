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

import { Component } from "./components/component";

type AllowedComponent<TComponentTypes extends ReadonlyArray<Component["type"]>> = Extract<
    Component,
    { type: TComponentTypes[number] }
>;

export class ComponentSlot<TComponentTypes extends ReadonlyArray<Component["type"]>> {
    readonly maxSize: number;

    readonly types: TComponentTypes;

    private component: AllowedComponent<TComponentTypes> | null = null;

    private constructor(maxSize: number, types: TComponentTypes) {
        this.maxSize = maxSize;
        this.types = types;
    }

    public static NewWarpDrive(maxSize: number): ComponentSlot<["warpDrive"]> {
        return new ComponentSlot(maxSize, ["warpDrive"]);
    }

    public static NewThrusters(maxSize: number): ComponentSlot<["thrusters"]> {
        return new ComponentSlot(maxSize, ["thrusters"]);
    }

    public static NewFuelTank(maxSize: number): ComponentSlot<["fuelTank"]> {
        return new ComponentSlot(maxSize, ["fuelTank"]);
    }

    public static NewDiscoveryScanner(maxSize: number): ComponentSlot<["discoveryScanner"]> {
        return new ComponentSlot(maxSize, ["discoveryScanner"]);
    }

    public static NewFuelScoop(maxSize: number): ComponentSlot<["fuelScoop"]> {
        return new ComponentSlot(maxSize, ["fuelScoop"]);
    }

    public static NewOptional(maxSize: number): OptionalComponentSlot {
        return new ComponentSlot(maxSize, ["fuelTank", "discoveryScanner", "fuelScoop"]);
    }

    public getComponent(): AllowedComponent<TComponentTypes> | null {
        return this.component;
    }

    public setComponent(component: AllowedComponent<TComponentTypes> | null): boolean {
        if (component !== null && (!this.types.includes(component.type) || component.size > this.maxSize)) {
            return false;
        }

        this.component = component;
        return true;
    }
}

export type OptionalComponentSlot = ComponentSlot<["fuelTank", "discoveryScanner", "fuelScoop"]>;
