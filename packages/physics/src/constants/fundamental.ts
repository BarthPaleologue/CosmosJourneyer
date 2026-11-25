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

import { kilograms, metersPerSecond, quantity } from "../units";

/**
 * Speed of light in meters per second.
 * @see https://en.wikipedia.org/wiki/Speed_of_light
 */
export const C = metersPerSecond(299_792_458);

/** The gravitational constant in m³/(kg·s²). */
export const G = quantity<"m³/(kg·s²)">(6.6743e-11);

/** Pi constant. Dimensionless. */
export const Pi = Math.PI;

/** Planck constant in J·s. */
export const PlanckConstant = quantity<"J·s">(6.626_070_15e-34);

/** Boltzmann constant in J/K. */
export const BoltzmannConstant = quantity<"J/K">(1.380_649e-23);

/** Mass of a proton in kg */
export const ProtonMass = kilograms(1.672_621_925_95e-27);

/** mu0 in H/m */
export const VacuumPermeability = quantity<"H/m">(1.256_637_061_27e-6);
