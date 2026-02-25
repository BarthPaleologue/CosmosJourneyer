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

import { type OrbitalObjectModel } from "@/backend/universe/orbitalObjects/index";

import { getStellarTypeFromTemperature } from "@/utils/physics/stellarTypes";
import { assertUnreachable, type DeepReadonly } from "@/utils/types";

import i18n from "@/i18n";

export function getOrbitalObjectTypeToI18nString(model: DeepReadonly<OrbitalObjectModel>): string {
    switch (model.type) {
        case "mandelbulb":
        case "juliaSet":
        case "mandelbox":
        case "sierpinskiPyramid":
        case "mengerSponge":
        case "darkKnight":
            return i18n.t("objectTypes:anomaly");
        case "gasPlanet":
            return i18n.t("objectTypes:gasPlanet");
        case "telluricPlanet":
            return i18n.t("objectTypes:telluricPlanet");
        case "telluricSatellite":
            return i18n.t("objectTypes:telluricMoon");
        case "spaceStation":
            return i18n.t("objectTypes:spaceStation");
        case "spaceElevator":
            return i18n.t("objectTypes:spaceElevator");
        case "star":
            return i18n.t("objectTypes:star", {
                stellarType: getStellarTypeFromTemperature(model.blackBodyTemperature),
            });
        case "neutronStar":
            return i18n.t("objectTypes:neutronStar");
        case "blackHole":
            return i18n.t("objectTypes:blackHole");
        case "custom":
            return i18n.t("objectTypes:custom");
        default:
            return assertUnreachable(model);
    }
}
