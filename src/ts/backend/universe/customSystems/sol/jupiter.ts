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

import { Tools } from "@babylonjs/core/Misc/tools";

import { GasPlanetModel } from "@/backend/universe/orbitalObjects/gasPlanetModel";
import { OrbitalObjectId } from "@/backend/universe/orbitalObjects/orbitalObjectId";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";

export function getJupiterModel(parentIds: ReadonlyArray<OrbitalObjectId>): GasPlanetModel {
    return {
        id: "jupiter",
        name: "Jupiter",
        type: OrbitalObjectType.GAS_PLANET,
        radius: 69_911e3,
        mass: 1.898e27,
        axialTilt: Tools.ToRadians(3.13),
        siderealDaySeconds: 60 * 60 * 9.925,
        orbit: {
            parentIds: [...parentIds],
            semiMajorAxis: 778_547_200e3,
            eccentricity: 0.0934,
            inclination: Tools.ToRadians(1.85),
            longitudeOfAscendingNode: Tools.ToRadians(49.558),
            argumentOfPeriapsis: Tools.ToRadians(286.502),
            initialMeanAnomaly: 0,
            p: 2,
        },
        atmosphere: {
            seaLevelPressure: 100_000,
            greenHouseEffectFactor: 0.7,
            gasMix: [
                ["H2", 0.9],
                ["He", 0.1],
            ],
        },
        colorPalette: {
            type: "textured",
            textureId: "jupiter",
        },
        rings: null,
        seed: 0,
    };
}
