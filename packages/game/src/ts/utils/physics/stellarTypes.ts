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

export type StellarType = "O" | "B" | "A" | "F" | "G" | "K" | "M";

export function getStellarTypeFromTemperature(temperature: number): StellarType {
    if (temperature < 3500) return "M";
    else if (temperature < 5000) return "K";
    else if (temperature < 6000) return "G";
    else if (temperature < 7500) return "F";
    else if (temperature < 10000) return "A";
    else if (temperature < 30000) return "B";
    else return "O";
}
