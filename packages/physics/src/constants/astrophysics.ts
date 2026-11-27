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
import { ampereSquareMeters, kelvin, kilograms, meters, metersPerSecondSquared, pascals } from "../units";

/**
 * The mass of the Earth in kilograms.
 */
export const EarthMass = kilograms(5.972e24);

/** The radius of the Earth in meters */
export const EarthRadius = meters(6_371e3);

/** The magnetic dipole moment of Earth in A·m². */
export const EarthMagneticDipoleMoment = ampereSquareMeters(7.8e22);

/**
 * The magnetic dipole moment of Mercury in A·m², approximated from MESSENGER observations.
 * @see https://pubmed.ncbi.nlm.nih.gov/21960627/
 */
export const MercuryMagneticDipoleMoment = ampereSquareMeters(2.8e19);

/**
 * The mass of the Moon in kilograms.
 */
export const MoonMass = kilograms(7.348e22);

/**
 * The mass of Jupiter in kilograms.
 */
export const JupiterMass = kilograms(1.898e27);

/** The radius of Jupiter in meters. */
export const JupiterRadius = meters(69_911e3);

/** The magnetic dipole moment of Jupiter in A·m². */
export const JupiterMagneticDipoleMoment = ampereSquareMeters(1.66e27);

/** The magnetic dipole moment of Saturn in A·m². */
export const SaturnMagneticDipoleMoment = ampereSquareMeters(4.6e25);

/** The magnetic dipole moment of Uranus in A·m². */
export const UranusMagneticDipoleMoment = ampereSquareMeters(3.9e24);

/** The magnetic dipole moment of Neptune in A·m². */
export const NeptuneMagneticDipoleMoment = ampereSquareMeters(2.16e24);

/**
 * The mass of the sun in kilograms.
 */
export const SolarMass = kilograms(1.989e30);

/**
 * The radius of the sun in meters.
 */
export const SolarRadius = meters(696340e3);

/**
 * The surface temperature of the sun in Kelvin.
 */
export const SolarTemperature = kelvin(5778);

/**
 * The gravitational acceleration in m/s².
 */
export const EarthG = metersPerSecondSquared(9.81);

/**
 * The sea level pressure on Earth in Pascals.
 */
export const EarthSeaLevelPressure = pascals(101_325);

/** The solar luminosity in Watts. */
export const SolarLuminosity = getBlackBodyLuminosity(SolarTemperature, SolarRadius);
