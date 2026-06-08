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

import { getSchwarzschildRadius } from "@cosmos-journeyer/physics";
import { assertUnreachable, type DeepReadonly } from "@cosmos-journeyer/typescript";

import { type CelestialBodyModel } from "./index";

export function getCelestialBodyRadius(body: DeepReadonly<CelestialBodyModel>): number {
    switch (body.type) {
        case "blackHole":
            return getSchwarzschildRadius(body.mass);
        case "darkKnight":
            return 100e3;
        case "star":
        case "neutronStar":
        case "telluricPlanet":
        case "telluricSatellite":
        case "gasPlanet":
        case "mandelbulb":
        case "juliaSet":
        case "mandelbox":
        case "sierpinskiPyramid":
        case "mengerSponge":
            return body.radius;
        default:
            return assertUnreachable(body);
    }
}
