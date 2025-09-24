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

import { type Component } from "./components/component";

export class ComponentSlot {
    readonly maxSize: number;

    readonly types: ReadonlyArray<Component["type"]>;

    private component: Component | null = null;

    private constructor(maxSize: number, types: ReadonlyArray<Component["type"]>) {
        this.maxSize = maxSize;
        this.types = types;
    }

    public static NewWarpDrive(maxSize: number): ComponentSlot {
        return new ComponentSlot(maxSize, ["warpDrive"]);
    }

    public static NewThrusters(maxSize: number): ComponentSlot {
        return new ComponentSlot(maxSize, ["thrusters"]);
    }

    public static NewFuelTank(maxSize: number): ComponentSlot {
        return new ComponentSlot(maxSize, ["fuelTank"]);
    }

    public static NewDiscoveryScanner(maxSize: number): ComponentSlot {
        return new ComponentSlot(maxSize, ["discoveryScanner"]);
    }

    public static NewFuelScoop(maxSize: number): ComponentSlot {
        return new ComponentSlot(maxSize, ["fuelScoop"]);
    }

    public static NewOptional(maxSize: number): ComponentSlot {
        return new ComponentSlot(maxSize, ["fuelTank", "discoveryScanner", "fuelScoop"]);
    }

    public getComponent(): Component | null {
        return this.component;
    }

    public setComponent(component: Component | null): boolean {
        if (component !== null && !this.types.includes(component.type)) {
            return false;
        }

        if (component !== null && component.size > this.maxSize) {
            return false;
        }

        this.component = component;
        return true;
    }
}
