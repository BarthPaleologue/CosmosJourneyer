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

const UniversalGasConstant = 8.314_462_618;

/** Computes the pressure scale height in metres. */
export function computeAtmospherePressureScaleHeight(
    temperature: number,
    gravity: number,
    meanMolecularWeight: number,
): number {
    return (UniversalGasConstant * temperature) / (meanMolecularWeight * gravity);
}

/** Computes the height at which a target pressure is reached. */
export function getHeightForPressure(
    targetPressure: number,
    reference: Readonly<{ pressure: number; height: number }>,
    scaleHeight: number,
): number {
    return reference.height - scaleHeight * Math.log(targetPressure / reference.pressure);
}
