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

import { OrbitalObjectType } from "../../architecture/orbitalObjectType";
import { HasSeed } from "../../architecture/hasSeed";
import { OrbitalObjectModelBase } from "../../architecture/orbitalObjectModelBase";
import { RingsModel } from "../../rings/ringsModel";

export type StarModel = OrbitalObjectModelBase<OrbitalObjectType.STAR> &
    HasSeed & {
        readonly radius: number;

        /**
         * The birth year of the star system. 0 corresponds to the big bang.
         * The birth year corresponds to the year when a stellar object was formed in the star system (first fusion for a star, creation of a singularity for a black hole, etc.).
         */
        readonly birthYear: number;

        /**
         * Black body temperature of the object in Kelvin
         */
        blackBodyTemperature: number;

        readonly rings: RingsModel | null;
    };
