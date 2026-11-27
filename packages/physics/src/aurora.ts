//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { ProtonMass, SolarRadius, VacuumPermeability } from "./constants";
import { getEscapeVelocity } from "./physics";
import { astronomicalUnitToMeters } from "./unitConversions";
import type {
    AmpereSquareMeters,
    Kilograms,
    Meters,
    MetersPerSecond,
    Pascals,
    PerCubicMeter,
    Radians,
    SquareMeters,
    Watts,
    WattsPerSquareMeter,
} from "./units";
import { meters, pascals, perCubicMeter, radians, squareMeters, watts, wattsPerSquareMeter } from "./units";

export type LocalStellarWindModel = {
    speed: MetersPerSecond;
    protonNumberDensity: PerCubicMeter;
};

/**
 * Estimates a steady, spherical proton wind with constant surface escape speed.
 * Assumes the same mass loss per unit stellar surface as the Sun, calibrated from
 * 5e6 protons/m³ at 1 AU flowing at 400 km/s (about 9.46e8 kg/s in total).
 * Ignores acceleration, stellar activity, and differences in wind driving mechanisms.
 * @param mass Stellar mass in kilograms.
 * @param radius Stellar radius in meters.
 * @param distance Distance from the stellar center in meters, outside the star.
 * @returns Wind speed in m/s and proton number density in m^-3.
 */
export function getStellarWind(mass: Kilograms, radius: Meters, distance: Meters): LocalStellarWindModel {
    const solarMassLossRate = 4 * Math.PI * astronomicalUnitToMeters(1) ** 2 * ProtonMass * 5e6 * 400_000;
    const massLossRate = solarMassLossRate * (radius / SolarRadius) ** 2;
    const speed = getEscapeVelocity(mass, radius);
    const protonNumberDensity = massLossRate / (4 * Math.PI * distance ** 2 * ProtonMass * speed);
    return { speed, protonNumberDensity: perCubicMeter(protonNumberDensity) };
}

/**
 * Estimates the polar cap boundary latitude from the magnetopause standoff distance.
 * @param planetRadius The planet radius in meters.
 * @param planetMoment The planet's magnetic dipole moment in A·m².
 * @param stellarWind The incident stellar wind properties.
 * @returns The polar cap boundary latitude in radians.
 */
export function getPolarCapLatitude(
    planetRadius: Meters,
    planetMoment: AmpereSquareMeters,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Branded quantities are immutable; the rule does not recognize brands nested in object types.
    stellarWind: Readonly<LocalStellarWindModel>,
): Radians {
    const standoffDistance = getMagnetopauseStandoffDistance(planetMoment, getStellarWindDynamicPressure(stellarWind));
    return getDipoleFieldLineLatitude(standoffDistance, planetRadius);
}

/**
 * Calculates the latitude where a dipole field line intersects the planet's surface.
 * @param lineMaxDistance The field line's maximum distance from the planet center in meters.
 * @param planetRadius The planet radius in meters.
 * @returns The northern intersection latitude in radians.
 */
export function getDipoleFieldLineLatitude(lineMaxDistance: Meters, planetRadius: Meters): Radians {
    return radians(Math.acos(Math.sqrt(planetRadius / lineMaxDistance)));
}

/**
 * Radius of a dipole magnetic field line at a given magnetic colatitude.
 * The line follows r = L·sin²(θ), reaching L at the magnetic equator (θ = π/2).
 * @param lineMaxDistance The line's L parameter: its equatorial distance from the center in meters.
 * @param theta Magnetic colatitude in radians, 0 at the north pole, π/2 at the equator.
 * @returns The distance from the dipole center in meters.
 */
export function getDipoleFieldLineRadius(lineMaxDistance: Meters, theta: Radians): Meters {
    const sinTheta = Math.sin(theta);
    return meters(lineMaxDistance * sinTheta * sinTheta);
}

/**
 * Limitation: supposes star belongs to dipole equatorial plane
 * @param moment The planet's magnetic dipole moment in A·m².
 * @param stellarWindPressure The incident stellar wind dynamic pressure in pascals.
 * @returns The distance from the planet center to the substellar magnetopause in meters.
 * @see https://en.wikipedia.org/wiki/Magnetopause#Estimating_the_standoff_distance_to_the_magnetopause
 */
export function getMagnetopauseStandoffDistance(moment: AmpereSquareMeters, stellarWindPressure: Pascals): Meters {
    // Magnetic field needed to balance stellar wind pressure
    const requiredStrength = Math.sqrt(2 * VacuumPermeability * stellarWindPressure);

    // chapman-ferraro reinforcement (see https://agupubs.onlinelibrary.wiley.com/doi/full/10.1002/2017RG000590 "3.1 Chapman-Ferraro Magnetopause Currents")
    const chapmanFerraroFactor = 2;

    // From magneticPressure === stellarWindPressure
    return meters(Math.cbrt((VacuumPermeability * chapmanFerraroFactor * moment) / (4 * Math.PI * requiredStrength)));
}

/**
 * Calculates the dynamic pressure of a proton stellar wind.
 * @param stellarWind The incident stellar wind properties.
 * @param stellarWind.speed The stellar wind speed in meters per second.
 * @param stellarWind.protonNumberDensity The proton number density in m^-3.
 * @returns The stellar wind dynamic pressure in pascals.
 * @see https://en.wikipedia.org/wiki/Solar_wind#Pressure
 */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Branded quantities are immutable; the rule does not recognize brands nested in object types.
export function getStellarWindDynamicPressure({
    speed,
    protonNumberDensity,
}: Readonly<LocalStellarWindModel>): Pascals {
    const massDensity = protonNumberDensity * ProtonMass;
    return pascals(massDensity * speed ** 2);
}

/**
 * Estimates the kinetic power of the stellar wind intercepted
 * by the planetary magnetosphere.
 * @param moment Planetary magnetic dipole moment (A·m²)
 * @param stellarWind Stellar wind properties (SI units)
 * @returns Incident kinetic power in watts
 */
export function getInterceptedStellarWindPower(
    moment: AmpereSquareMeters,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Branded quantities are immutable; the rule does not recognize brands nested in object types.
    stellarWind: Readonly<LocalStellarWindModel>,
): Watts {
    const { speed, protonNumberDensity } = stellarWind;

    const standoffDistance = getMagnetopauseStandoffDistance(moment, getStellarWindDynamicPressure(stellarWind));
    const crossSection = Math.PI * standoffDistance ** 2;

    const massDensity = protonNumberDensity * ProtonMass;
    const massFlowRate = massDensity * speed * crossSection;

    return watts(0.5 * massFlowRate * speed ** 2);
}

/**
 * Computes the combined surface area of two symmetric auroral ovals.
 * @param planetRadius Planetary radius in meters.
 * @param auroralRange Absolute equatorward and poleward magnetic latitudes in radians.
 * @returns Total auroral area across both hemispheres in m².
 */
export function getAuroralOvalArea(
    planetRadius: Meters,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Branded quantities are immutable; the rule does not recognize brands nested in tuple types.
    auroralRange: readonly [equatorward: Radians, poleward: Radians],
): SquareMeters {
    const areaPerHemisphere = 2 * Math.PI * planetRadius ** 2 * (Math.sin(auroralRange[1]) - Math.sin(auroralRange[0]));

    return squareMeters(2 * areaPerHemisphere);
}

/**
 * Estimates the mean visible auroral radiant energy flux.
 * Uses empirical terrestrial efficiencies and assumes two symmetric auroral ovals.
 * @param planetRadius Planet radius in meters.
 * @param planetMoment Planetary magnetic dipole moment in A·m².
 * @param stellarWind Incident stellar wind properties.
 * @param auroralRange Absolute equatorward and poleward magnetic latitudes in radians.
 * @returns Mean visible auroral radiant energy flux in W/m².
 */
export function getAuroralVisibleEnergyFlux(
    planetRadius: Meters,
    planetMoment: AmpereSquareMeters,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Branded quantities are immutable; the rule does not recognize brands nested in object types.
    stellarWind: Readonly<LocalStellarWindModel>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Branded quantities are immutable; the rule does not recognize brands nested in tuple types.
    auroralRange: readonly [equatorward: Radians, poleward: Radians],
): WattsPerSquareMeter {
    // Empirical Earth values for HILDCAA events (Hajra et al., 2014)
    // Adjusted for our kinetic power convention: P_ours = (π/2) * P_Hajra
    const couplingEfficiency = (0.0097 * 2) / Math.PI;
    const precipitationEfficiency = 0.215;

    // Provisional assumption, not empirically calibrated
    const visibleRadiativeEfficiency = 0.01;

    const auroralArea = getAuroralOvalArea(planetRadius, auroralRange);

    const interceptedPower = getInterceptedStellarWindPower(planetMoment, stellarWind);

    const coupledPower = couplingEfficiency * interceptedPower;

    const precipitationPower = precipitationEfficiency * coupledPower;

    const precipitationEnergyFlux = precipitationPower / auroralArea;

    return wattsPerSquareMeter(precipitationEnergyFlux * visibleRadiativeEfficiency);
}
