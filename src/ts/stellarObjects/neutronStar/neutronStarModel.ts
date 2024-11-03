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

import { HasSeed } from "../../architecture/hasSeed";
import { CelestialBodyModelBase } from "../../architecture/orbitalObjectModelBase";
import { OrbitalObjectType } from "../../architecture/orbitalObjectType";
import { RingsModel } from "../../rings/ringsModel";

export type NeutronStarModel = CelestialBodyModelBase<OrbitalObjectType.NEUTRON_STAR> &
    HasSeed & {
        readonly blackBodyTemperature: number;

        /**
         * The birth year of the star system. 0 corresponds to the big bang.
         * The birth year corresponds to the year when a stellar object was formed in the star system (first fusion for a star, creation of a singularity for a black hole, etc.).
         */
        readonly birthYear: number;

        /**
         * The angle between the magnetic dipole axis and the rotation axis.
         * If the magnetic field were perfectly aligned with the rotation axis, this angle would be 0.
         */
        readonly dipoleTilt: number;

        readonly rings: RingsModel | null;
    };
