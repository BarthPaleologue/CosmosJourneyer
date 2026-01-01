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

import { uniformRandBool } from "extended-random";

import { IllustriousFigures } from "./illustriousFigures";

export const SpaceStationDesignators = [
    "Abode",
    "Apex",
    "Arcadia",
    "Bar",
    "Bastion",
    "Beacon",
    "Citadel",
    "Colony",
    "Constellation",
    "Crown",
    "Dawn",
    "Discovery",
    "Domain",
    "Elysium",
    "Endeavour",
    "Enterprise",
    "Epiphany",
    "Eternity",
    "Expanse",
    "Firmament",
    "Foundation",
    "Frontier",
    "Gateway",
    "Habitat",
    "Haven",
    "Horizon",
    "Inception",
    "Interstellar",
    "Journey",
    "Laboratory",
    "Nexus",
    "Oasis",
    "Olympus",
    "Oracle",
    "Orbital",
    "Outpost",
    "Paradise",
    "Pinnacle",
    "Port",
    "Prospect",
    "Prosperity",
    "Radiance",
    "Refuge",
    "Resort",
    "Reverie",
    "Sanctuary",
    "Settlement",
    "Station",
    "Terminal",
    "Tranquility",
    "Transcendence",
    "Unity",
    "Utopia",
    "Vanguard",
    "Vision",
    "Zenith",
] as const;

export const SpaceElevatorDesignators = [
    "Anchor",
    "Ascent",
    "Ascension",
    "Ascending",
    "Bridge",
    "Climb",
    "Climbing",
    "Conduit",
    "Elevation",
    "Elevator",
    "Gateway",
    "Ladder",
    "Lift",
    "Lifting",
    "Rising",
    "Skyward",
    "Soaring",
    "Stairway",
    "Tether",
    "Updraft",
    "Upward",
] as const;

/**
 * Generate a space station name using a noise based rng and a given sample index
 * @param rng The noise based rng with a range of [0, 1]
 * @param sampleIndex The index of the sample to generate
 */
export function generateSpaceStationName(rng: (index: number) => number, sampleIndex: number) {
    const designator = SpaceStationDesignators[Math.floor(rng(sampleIndex) * SpaceStationDesignators.length)];
    const name = IllustriousFigures[Math.floor(rng(sampleIndex + 1) * IllustriousFigures.length)]?.lastName;
    return `${name}${uniformRandBool(0.5, rng, sampleIndex + 2) ? "'s" : ""} ${designator}`;
}

export function generateSpaceElevatorName(rng: (index: number) => number, sampleIndex: number) {
    const designator = SpaceElevatorDesignators[Math.floor(rng(sampleIndex) * SpaceElevatorDesignators.length)];
    const name = IllustriousFigures[Math.floor(rng(sampleIndex + 1) * IllustriousFigures.length)]?.lastName;
    return `${name}${uniformRandBool(0.5, rng, sampleIndex + 2) ? "'s" : ""} ${designator}`;
}
