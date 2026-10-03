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

import { astronomicalUnitToMeters } from "@cosmos-journeyer/physics";
import type { OrbitalObjectId } from "@cosmos-journeyer/universe-model";

import type { InOrbitPlacementModel, SystemContentModel } from "@/backend/systemEntity/systemEntityModel";

export type DarkKnightModel = SystemContentModel<"darkKnight">;

export function createDarkKnightOrbitalPlacementModel(parentIds: Iterable<OrbitalObjectId>): InOrbitPlacementModel {
    return {
        type: "inOrbit",
        mass: 1e15,
        orbit: {
            parentIds: [...parentIds],
            argumentOfPeriapsis: 0,
            eccentricity: 0,
            p: 1,
            inclination: 0,
            longitudeOfAscendingNode: 0,
            semiMajorAxis: astronomicalUnitToMeters(100),
            initialMeanAnomaly: 0,
        },
        rotation: {
            axialTilt: 0,
            siderealPeriod: 0,
            spinAxisAzimuth: 0,
            initialRotationAngle: 0,
        },
    };
}
