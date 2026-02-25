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

import { assertUnreachable } from "@/utils/types";

import i18n from "@/i18n";

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

export function getComponentTypeI18n(type: SerializedComponent["type"]): string {
    switch (type) {
        case "warpDrive":
            return i18n.t("components:warpDrive");
        case "fuelScoop":
            return i18n.t("components:fuelScoop");
        case "fuelTank":
            return i18n.t("components:fuelTank");
        case "discoveryScanner":
            return i18n.t("components:discoveryScanner");
        case "thrusters":
            return i18n.t("components:thrusters");
        default:
            return assertUnreachable(type);
    }
}
