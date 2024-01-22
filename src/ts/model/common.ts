//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

export enum GENERATION_STEPS {
    AXIAL_TILT = 100,
    ORBIT = 200,
    ORBITAL_PERIOD = 500,
    RADIUS = 1000,
    ORBITAL_PLANE_ALIGNEMENT = 1600,

    RINGS = 1200,

    NB_MOONS = 10,
    MOONS = 11,

    POWER = 300,
    ACCENNT_COLOR = 400,

    TEMPERATURE = 1100,

    PRESSURE = 1100,
    WATER_AMOUNT = 1200,
    TERRAIN = 1500
}

export enum BODY_TYPE {
    STAR,
    TELLURIC_PLANET,
    GAS_PLANET,
    MANDELBULB,
    BLACK_HOLE,
    NEUTRON_STAR
}
