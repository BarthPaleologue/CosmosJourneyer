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

import { type Gas } from "@/backend/universe/orbitalObjects/atmosphereModel";

import { type DeepReadonly } from "@/utils/types";

/**
 * @param gas The gas for which to return the refractive index.
 * @returns The refractive index of the gas at standard conditions.
 * @see https://www.engineeringtoolbox.com/refractive-index-d_1264.html
 */
export function getGasRefractiveIndex(gas: Gas): number {
    switch (gas) {
        case "N2":
            return 1.000298;
        case "O2":
            return 1.000271;
        case "Ar":
            return 1.000281;
        case "CO2":
            return 1.00045;
        case "He":
            return 1.00003;
        case "Ne":
            return 1.000067;
        case "H2":
            return 1.000118;
        case "CH4":
            return 1.000444;
        case "SO2":
            return 1.000686;
    }
}

export function getGasDepolarization(gas: Gas): number {
    switch (gas) {
        case "N2":
            return 0.022;
        case "O2":
            return 0.054;
        case "CO2":
            // King correction is 1.1364 according to https://acp.copernicus.org/articles/21/14927/2021/acp-21-14927-2021.pdf
            // So solving for delta in the King correction formula gives us 0.075
            return 0.075;
        case "Ar":
        case "He":
        case "Ne":
        case "H2":
        case "CH4":
        case "SO2":
            return 0; // Remaining gases assumed ≈ 0
    }
}

/**
 * @param gas The gas for which to return the molar mass in g/mol.
 * @returns The molar mass of the gas in grams per mole.
 * @see https://en.wikipedia.org/wiki/Molar_mass
 */
export function getMolarMass(gas: Gas): number {
    switch (gas) {
        case "N2":
            return 28.0134;
        case "O2":
            return 31.9988;
        case "Ar":
            return 39.948;
        case "CO2":
            return 44.0095;
        case "He":
            return 4.002602;
        case "Ne":
            return 20.1797;
        case "H2":
            return 2.01588;
        case "CH4":
            return 16.043;
        case "SO2":
            return 64.066;
    }
}

/**
 * Mean molecular weight μ (kg mol-1) of a gas mixture.
 */
export function computeMeanMolecularWeight(fractions: DeepReadonly<Array<[Gas, number]>>): number {
    const sum = fractions.reduce((s, [, x]) => s + x, 0);
    return 1e-3 * fractions.reduce((mean, [gas, x]) => mean + (x / sum) * getMolarMass(gas), 0);
}
