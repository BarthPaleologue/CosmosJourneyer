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

import { assertUnreachable } from "@/utils/types";

import { DiscoveryScanner } from "./discoveryScanner";
import { FuelScoop } from "./fuelScoop";
import { FuelTank } from "./fuelTank";
import { Thrusters } from "./thrusters";
import { WarpDrive } from "./warpDrive";

export type Component = WarpDrive | FuelScoop | FuelTank | DiscoveryScanner | Thrusters;

export function deserializeComponent(serializedComponent: SerializedComponent): Component {
    switch (serializedComponent.type) {
        case "warpDrive":
            return new WarpDrive(serializedComponent);
        case "fuelScoop":
            return new FuelScoop(serializedComponent);
        case "fuelTank":
            return new FuelTank(serializedComponent);
        case "discoveryScanner":
            return new DiscoveryScanner(serializedComponent);
        case "thrusters":
            return new Thrusters(serializedComponent);
        default:
            return assertUnreachable(serializedComponent);
    }
}
