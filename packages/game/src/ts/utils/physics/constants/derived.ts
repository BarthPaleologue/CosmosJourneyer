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

import { BoltzmannConstant, C, Pi, PlanckConstant } from "./fundamental";

/** Reduced Planck constant in J·s. */
export const ReducedPlanckConstant = PlanckConstant / (2 * Pi);

/** Stefan-Boltzmann constant in W·m⁻²·K⁻⁴. */
export const StefanBoltzmannConstant = (2 * Pi ** 5 * BoltzmannConstant ** 4) / (15 * PlanckConstant ** 3 * C ** 2);

/** The number of meters in a light year. */
export const LightYearInMeters = C * 60 * 60 * 24 * 365.25;
