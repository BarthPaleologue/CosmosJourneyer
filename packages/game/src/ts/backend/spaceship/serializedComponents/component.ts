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

import { assertUnreachable } from "@cosmos-journeyer/typescript";
import type { TFunction } from "i18next";
import { z } from "zod";

import { SerializedDiscoveryScannerSchema } from "./discoveryScanner";
import { SerializedFuelScoopSchema } from "./fuelScoop";
import { SerializedFuelTankSchema } from "./fuelTank";
import { SerializedThrustersSchema } from "./thrusters";
import { SerializedWarpDriveSchema } from "./warpDrive";

export const SerializedComponentSchema = z.discriminatedUnion("type", [
    SerializedWarpDriveSchema,
    SerializedFuelScoopSchema,
    SerializedFuelTankSchema,
    SerializedDiscoveryScannerSchema,
    SerializedThrustersSchema,
]);

export type SerializedComponent = z.infer<typeof SerializedComponentSchema>;

export function getComponentTypeI18n(type: SerializedComponent["type"], t: TFunction): string {
    switch (type) {
        case "warpDrive":
            return t("components:warpDrive");
        case "fuelScoop":
            return t("components:fuelScoop");
        case "fuelTank":
            return t("components:fuelTank");
        case "discoveryScanner":
            return t("components:discoveryScanner");
        case "thrusters":
            return t("components:thrusters");
        default:
            return assertUnreachable(type);
    }
}
