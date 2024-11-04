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

// https://www.omnicalculator.com/chemistry/boiling-point
// https://www.wikiwand.com/en/Boiling_point#/Saturation_temperature_and_pressure
// https://www.desmos.com/calculator/ctxerbh48s

/**
 * @param {number} pressure in pascal
 * @returns {number} water boiling temperature in Kelvin
*/
float waterBoilingTemperature(float pressure) {
    float P1 = 101325.0;// sea level pressure on Earth in pascal
    float P2 = pressure;
    float T1 = 273.15 + 100.0;// boiling point of water at sea level on Earth in Kelvin
    float DH = 40660.0;
    float R = 8.314;
    if (P2 <= 0.0) return 0.0;// when pressure is 0, water cannot exist in liquid state
    return 1.0 / (1.0 / T1 + log(P1 / P2) * (R / DH));
}