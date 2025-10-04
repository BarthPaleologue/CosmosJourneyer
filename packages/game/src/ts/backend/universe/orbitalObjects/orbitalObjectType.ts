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

export const enum OrbitalObjectType {
    STAR = 0,
    NEUTRON_STAR = 1,
    BLACK_HOLE = 2,
    TELLURIC_PLANET = 1000,
    TELLURIC_SATELLITE = 1001,
    GAS_PLANET = 1002,
    MANDELBULB = 2000,
    JULIA_SET = 2001,
    MANDELBOX = 2002,
    SIERPINSKI_PYRAMID = 2003,
    MENGER_SPONGE = 2004,
    DARK_KNIGHT = 2005,
    SPACE_STATION = 3000,
    SPACE_ELEVATOR = 3001,
    CUSTOM = 4242,
}

export function getOrbitalObjectTypeStringId(type: OrbitalObjectType): string {
    switch (type) {
        case OrbitalObjectType.STAR:
            return "star";
        case OrbitalObjectType.NEUTRON_STAR:
            return "neutronStar";
        case OrbitalObjectType.BLACK_HOLE:
            return "blackHole";
        case OrbitalObjectType.TELLURIC_PLANET:
            return "telluricPlanet";
        case OrbitalObjectType.TELLURIC_SATELLITE:
            return "telluricSatellite";
        case OrbitalObjectType.GAS_PLANET:
            return "gasPlanet";
        case OrbitalObjectType.MANDELBULB:
            return "mandelbulb";
        case OrbitalObjectType.JULIA_SET:
            return "juliaSet";
        case OrbitalObjectType.MANDELBOX:
            return "mandelbox";
        case OrbitalObjectType.SIERPINSKI_PYRAMID:
            return "sierpinskiPyramid";
        case OrbitalObjectType.MENGER_SPONGE:
            return "mengerSponge";
        case OrbitalObjectType.DARK_KNIGHT:
            return "darkKnight";
        case OrbitalObjectType.SPACE_STATION:
            return "spaceStation";
        case OrbitalObjectType.SPACE_ELEVATOR:
            return "spaceElevator";
        case OrbitalObjectType.CUSTOM:
            return "custom";
    }
}
