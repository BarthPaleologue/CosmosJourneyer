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
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { getStellarTypeFromTemperature } from "@/backend/universe/proceduralGenerators/stellarObjects/starModelGenerator";

import { type DeepReadonly } from "@/utils/types";

import i18n from "@/i18n";

export function getOrbitalObjectTypeToI18nString(model: DeepReadonly<OrbitalObjectModel>): string {
    switch (model.type) {
        case OrbitalObjectType.MANDELBULB:
        case OrbitalObjectType.JULIA_SET:
        case OrbitalObjectType.MANDELBOX:
        case OrbitalObjectType.SIERPINSKI_PYRAMID:
        case OrbitalObjectType.MENGER_SPONGE:
        case OrbitalObjectType.DARK_KNIGHT:
            return i18n.t("objectTypes:anomaly");
        case OrbitalObjectType.GAS_PLANET:
            return i18n.t("objectTypes:gasPlanet");
        case OrbitalObjectType.TELLURIC_PLANET:
            return i18n.t("objectTypes:telluricPlanet");
        case OrbitalObjectType.TELLURIC_SATELLITE:
            return i18n.t("objectTypes:telluricMoon");
        case OrbitalObjectType.SPACE_STATION:
            return i18n.t("objectTypes:spaceStation");
        case OrbitalObjectType.SPACE_ELEVATOR:
            return i18n.t("objectTypes:spaceElevator");
        case OrbitalObjectType.STAR:
            return i18n.t("objectTypes:star", {
                stellarType: getStellarTypeFromTemperature(model.blackBodyTemperature),
            });
        case OrbitalObjectType.NEUTRON_STAR:
            return i18n.t("objectTypes:neutronStar");
        case OrbitalObjectType.BLACK_HOLE:
            return i18n.t("objectTypes:blackHole");
        case OrbitalObjectType.CUSTOM:
            return i18n.t("objectTypes:custom");
    }
}
