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

import { CelestialBodyModel } from "../architecture/celestialBody";
import { OrbitalObjectType } from "../architecture/orbitalObject";

export type AnomalyObjectType =
    | OrbitalObjectType.MANDELBULB
    | OrbitalObjectType.JULIA_SET
    | OrbitalObjectType.MANDELBOX
    | OrbitalObjectType.SIERPINSKI_PYRAMID
    | OrbitalObjectType.MENGER_SPONGE;

export interface AnomalyModel extends CelestialBodyModel {
    readonly type: AnomalyObjectType;
}
