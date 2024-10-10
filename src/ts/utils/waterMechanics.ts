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
 *
 * @param pressure
 * @see https://www.omnicalculator.com/chemistry/boiling-point
 * @see https://www.wikiwand.com/en/Boiling_point#/Saturation_temperature_and_pressure
 * @see https://www.desmos.com/calculator/ctxerbh48s
 */
export function waterBoilingPointCelsius(pressure: number): number {
    const P1 = 1.0;
    const P2 = pressure;
    const T1 = 100.0 + 273.15;
    const DH = 40660.0;
    const R = 8.314;
    if (P2 > 0.0) return 1.0 / (1.0 / T1 + Math.log(P1 / P2) * (R / DH)) - 273.15;
    return -273.15;
}
