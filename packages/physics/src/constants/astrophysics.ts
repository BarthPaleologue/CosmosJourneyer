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

import { getBlackBodyLuminosity } from "../thermodynamics";

/**
 * The astronomical unit in meters.
 */
export const AU = 150e9;

/**
 * The mass of the Earth in kilograms.
 */
export const EarthMass = 5.972e24;

/** The radius of the Earth in meters */
export const EarthRadius = 6_371e3;

/** The magnetic dipole moment of Earth in A·m². */
export const EarthMagneticDipoleMoment = 7.8e22;

/**
 * The mass of the Moon in kilograms.
 */
export const MoonMass = 7.348e22;

/**
 * The mass of Jupiter in kilograms.
 */
export const JupiterMass = 1.898e27;

/** The radius of Jupiter in meters. */
export const JupiterRadius = 69_911e3;

/** The magnetic dipole moment of Jupiter in A·m². */
export const JupiterMagneticDipoleMoment = 1.66e27;

/** The magnetic dipole moment of Saturn in A·m². */
export const SaturnMagneticDipoleMoment = 4.6e25;

/** The magnetic dipole moment of Uranus in A·m². */
export const UranusMagneticDipoleMoment = 3.9e24;

/** The magnetic dipole moment of Neptune in A·m². */
export const NeptuneMagneticDipoleMoment = 2.16e24;

/**
 * The mass of the sun in kilograms.
 */
export const SolarMass = 1.989e30;

/**
 * The radius of the sun in meters.
 */
export const SolarRadius = 696340e3;

/**
 * The surface temperature of the sun in Kelvin.
 */
export const SolarTemperature = 5778;

/**
 * The gravitational acceleration in m/s^2.
 */
export const EarthG = 9.81;

/**
 * The sea level pressure on Earth in Pascals.
 */
export const EarthSeaLevelPressure = 101_325;

/** The solar luminosity in Watts. */
export const SolarLuminosity = getBlackBodyLuminosity(SolarTemperature, SolarRadius);
