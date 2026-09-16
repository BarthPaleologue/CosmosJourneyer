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

export type Gas = "N2" | "O2" | "Ar" | "CO2" | "He" | "Ne" | "H2" | "CH4" | "SO2";

export type GasFraction = readonly [gas: Gas, fraction: number];

export type GasMix = ReadonlyArray<GasFraction>;

/** Returns the refractive index of a gas at standard conditions. */
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
            // King correction 1.1364 gives delta = 0.075.
            // https://acp.copernicus.org/articles/21/14927/2021/
            return 0.075;
        case "Ar":
        case "He":
        case "Ne":
        case "H2":
        case "CH4":
        case "SO2":
            return 0;
    }
}

/** Returns the molar mass of a gas in grams per mole. */
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

/** Computes the mean molecular weight in kg/mol of a gas mixture. */
export function computeMeanMolecularWeight(gasMix: GasMix): number {
    const sum = gasMix.reduce((total, [, fraction]) => total + fraction, 0);
    return 1e-3 * gasMix.reduce((mean, [gas, fraction]) => mean + (fraction / sum) * getMolarMass(gas), 0);
}
