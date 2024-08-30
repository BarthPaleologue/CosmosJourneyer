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

export const enum BodyType {
    STAR,
    TELLURIC_PLANET,
    GAS_PLANET,
    ANOMALY,
    BLACK_HOLE,
    NEUTRON_STAR
}

export function bodyTypeToString(bodyType: BodyType): string {
    switch (bodyType) {
        case BodyType.STAR:
            return "Star";
        case BodyType.TELLURIC_PLANET:
            return "Telluric planet";
        case BodyType.GAS_PLANET:
            return "Gas planet";
        case BodyType.ANOMALY:
            return "Anomaly";
        case BodyType.BLACK_HOLE:
            return "Black hole";
        case BodyType.NEUTRON_STAR:
            return "Neutron star";
    }
}