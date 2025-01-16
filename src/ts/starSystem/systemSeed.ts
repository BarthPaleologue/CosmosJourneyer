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

/**
 * Seed used to generate star systems in a pseudo-random fashion.
 */
export type SystemSeed = {
    /**
     * The X coordinate of the star sector (integer).
     */
    starSectorX: number;
    /**
     * The Y coordinate of the star sector (integer).
     */
    starSectorY: number;
    /**
     * The Z coordinate of the star sector (integer).
     */
    starSectorZ: number;
    /**
     * The index of the system inside its star sector (integer).
     */
    index: number;
};
