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

import { StefanBoltzmannConstant } from "./constants/derived";
import { BoltzmannConstant, C, PlanckConstant } from "./constants/fundamental";
import type { Kelvin, Meters, Quantity, SquareMeters, Watts, WattsPerSquareMeter } from "./units";
import { quantity, squareMeters, watts, wattsPerSquareMeter } from "./units";

/**
 * Applies Planck's law to calculate black body spectral exitance Mλ = 2πhc² / (λ⁵ expm1(hc/(λkT))).
 * @param temperature The black body temperature in kelvin.
 * @param wavelength The wavelength in meters.
 * @returns The hemispherically integrated spectral exitance per unit wavelength in W/m³.
 */
export function getBlackBodySpectralExitance(temperature: Kelvin, wavelength: Meters): Quantity<"W/m³"> {
    return quantity(
        (2 * Math.PI * PlanckConstant * C ** 2) /
            (wavelength ** 5 * Math.expm1((PlanckConstant * C) / (wavelength * BoltzmannConstant * temperature))),
    );
}

/**
 * Applies Stefan-Boltzmann law to calculate the radiative flux of a black body.
 * @param temperature The temperature of the black body in Kelvin.
 * @returns The radiative flux in W/m².
 */
export function getBlackBodyRadiatedFlux(temperature: Kelvin): WattsPerSquareMeter {
    return wattsPerSquareMeter(StefanBoltzmannConstant * temperature ** 4);
}

/**
 * Calculates the emitted radiative flux of a surface at a given temperature and emissivity.
 * @param temperature The temperature of the surface in Kelvin.
 * @param emissivity The emissivity of the surface (between 0=perfect reflector and 1=perfect radiator, dimensionless).
 * @returns The emitted radiative flux in W/m².
 */
export function getRadiatedFlux(temperature: Kelvin, emissivity: number): WattsPerSquareMeter {
    return wattsPerSquareMeter(emissivity * getBlackBodyRadiatedFlux(temperature));
}

/**
 * Calculates the total radiated power (luminosity) of a blackbody sphere of a given radius and temperature (typically a star) using the Stefan-Boltzmann law.
 * @param temperature The temperature of the sphere in Kelvin.
 * @param radius The radius of the sphere in meters.
 * @returns The total radiated power in Watts.
 */
export function getBlackBodyLuminosity(temperature: Kelvin, radius: Meters): Watts {
    return watts(getBlackBodyRadiatedFlux(temperature) * 4 * Math.PI * radius ** 2);
}

/**
 * Calculates the irradiance (received radiative power per unit area)
 * at a given distance from a blackbody sphere assuming isotropic emission.
 * Assumes distance is large compared to the radius of the sphere.
 * @param temperature The surface temperature of the sphere in Kelvin.
 * @param radius The radius of the sphere in meters.
 * @param distance The distance from the sphere center in meters.
 * @returns The irradiance in W/m² at the given distance.
 */
export function getSphereIrradianceAtDistance(
    temperature: Kelvin,
    radius: Meters,
    distance: Meters,
): WattsPerSquareMeter {
    return wattsPerSquareMeter(getBlackBodyLuminosity(temperature, radius) / (4 * Math.PI * distance ** 2));
}

/**
 * @param heatToDissipate The amount of heat to dissipate in Watts
 * @param targetTemperature The target radiator temperature in Kelvin
 * @param emissivity The radiator emissivity (between 0 and 1, dimensionless)
 * @param doubleSided Whether the radiator is double-sided (radiates on both sides)
 * @returns The area necessary to dissipate the given heat at the target temperature and emissivity, in square meters
 */
export function getRadiatorAreaForHeat(
    heatToDissipate: Watts,
    targetTemperature: Kelvin,
    emissivity: number,
    doubleSided: boolean,
): SquareMeters {
    const radiatorFlux = getRadiatedFlux(targetTemperature, emissivity);
    const singleSidedArea = heatToDissipate / radiatorFlux;

    return squareMeters(doubleSided ? singleSidedArea / 2 : singleSidedArea);
}
