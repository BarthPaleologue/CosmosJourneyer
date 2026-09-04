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

import { getStellarTypeFromTemperature } from "@cosmos-journeyer/physics";
import { assertUnreachable } from "@cosmos-journeyer/typescript";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { OrbitalObjectModel } from "@cosmos-journeyer/universe-model";
import type { TFunction } from "i18next";

export function getOrbitalObjectTypeToI18nString(model: DeepReadonly<OrbitalObjectModel>, t: TFunction): string {
    switch (model.type) {
        case "mandelbulb":
        case "juliaSet":
        case "mandelbox":
        case "sierpinskiPyramid":
        case "mengerSponge":
        case "darkKnight":
            return t("objectTypes:anomaly");
        case "gasPlanet":
            return t("objectTypes:gasPlanet");
        case "telluricPlanet":
            return t("objectTypes:telluricPlanet");
        case "telluricSatellite":
            return t("objectTypes:telluricMoon");
        case "spaceStation":
            return t("objectTypes:spaceStation");
        case "spaceElevator":
            return t("objectTypes:spaceElevator");
        case "star":
            return t("objectTypes:star", {
                stellarType: getStellarTypeFromTemperature(model.blackBodyTemperature),
            });
        case "neutronStar":
            return t("objectTypes:neutronStar");
        case "blackHole":
            return t("objectTypes:blackHole");
        case "custom":
            return t("objectTypes:custom");
        default:
            return assertUnreachable(model);
    }
}
