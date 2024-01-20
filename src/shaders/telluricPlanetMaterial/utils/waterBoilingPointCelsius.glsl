//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

// https://www.omnicalculator.com/chemistry/boiling-point
// https://www.wikiwand.com/en/Boiling_point#/Saturation_temperature_and_pressure
// https://www.desmos.com/calculator/ctxerbh48s
float waterBoilingPointCelsius(float pressure) {
    float P1 = 1.0;
    float P2 = pressure;
    float T1 = 100.0 + 273.15;
    float DH = 40660.0;
    float R = 8.314;
    if(P2 > 0.0) return (1.0 / ((1.0 / T1) + log(P1 / P2) * (R / DH))) - 273.15;
    return -273.15;
}