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

export const GenerationSteps = {
    AXIAL_TILT: 100,
    ORBIT: 200,
    RADIUS: 1000,
    ORBITAL_PLANE_ALIGNMENT: 1600,

    RINGS: 1200,

    POWER: 300,
    ACCENT_COLOR: 400,

    TEMPERATURE: 1100,
    STELLAR_TYPE: 1900,

    PRESSURE: 1800,
    WATER_AMOUNT: 1700,
    TERRAIN: 1500,

    DIPOLE_TILT: 1300,

    SIDEREAL_DAY_SECONDS: 2500,

    ATMOSPHERE: {
        AEROSOLS: {
            TAU_550: 3000,
            SETTLING_COEFFICIENT: 3100,
            PARTICLE_RADIUS: 3200,
            ANGSTROM_EXPONENT: 3300,
        },
    },
} as const;
