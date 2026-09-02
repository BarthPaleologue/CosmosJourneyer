//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import type { TFunction } from "i18next";

import { getOrbitalObjectTypeToI18nString } from "../helpers/orbitalObjectTypeToDisplay";
import type { OrbitalObject } from "../simulation/architecture/orbitalObject";

export function getOrbitalObjectCategoryName(orbitalObject: OrbitalObject, t: TFunction): string {
    return getOrbitalObjectTypeToI18nString(orbitalObject.model, t);
}
