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

export const SpaceStationNames: string[] = [
    "Aldrin",
    "Apollo",
    "Archimedes",
    "Armstrong",
    "Asimov",
    "Babbage",
    "Blinn",
    "Bohr",
    "Boole",
    "Bradbury",
    "Catmull",
    "Clark",
    "Clarke",
    "Copernicus",
    "Curie",
    "Darwin",
    "Egan",
    "Einstein",
    "Fermat",
    "Feynman",
    "Fibonacci",
    "Franklin",
    "Gagarin",
    "Galileo",
    "Gauss",
    "Gemini",
    "Glenn",
    "Goodal",
    "Gouraud",
    "Hawking",
    "Heinlein",
    "Heisenberg",
    "Herbert",
    "Huygens",
    "Kepler",
    "Kubrick",
    "Laika",
    "LeCun",
    "Lovelace",
    "Mercury",
    "Musk",
    "Newton",
    "Pascal",
    "Pasteur",
    "Pesquet",
    "Phong",
    "Picard",
    "Pratchett",
    "Pythagoras",
    "Rayleigh",
    "Shotwell",
    "Stanford",
    "Sutherland",
    "Suzanne",
    "Tesla",
    "Tolkien",
    "Tolstoy",
    "Torvalds",
    "Turing",
    "Verne",
    "Von Braun",
    "Von Neumann",
];

export const SpaceStationAdjectives: string[] = [
    "Abode",
    "Apex",
    "Bar",
    "Bastion",
    "Citadel",
    "Colony",
    "Constellation",
    "Discovery",
    "Domain",
    "Elysium",
    "Endeavour",
    "Enterprise",
    "Epiphany",
    "Eternity",
    "Expanse",
    "Foundation",
    "Frontier",
    "Habitat",
    "Haven",
    "Horizon",
    "Inception",
    "Interstellar",
    "Journey",
    "Laboratory",
    "Nexus",
    "Oasis",
    "Orbital",
    "Outpost",
    "Paradise",
    "Pinnacle",
    "Prospect",
    "Prosperity",
    "Refuge",
    "Resort",
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
];

export const SpaceElevatorAdjectives: string[] = [
    "Ascension",
    "Ascending",
    "Bridge",
    "Climb",
    "Climbing",
    "Elevated",
    "Elevation",
    "Elevator",
    "Ladder",
    "Lift",
    "Lifting",
    "Rising",
    "Skyward",
    "Soaring",
    "Upward",
];

/**
 * Generate a space station name using a noise based rng and a given sample index
 * @param rng The noise based rng with a range of [0, 1]
 * @param sampleIndex The index of the sample to generate
 */
export function generateSpaceStationName(rng: (index: number) => number, sampleIndex: number) {
    const adjective = SpaceStationAdjectives[Math.floor(rng(sampleIndex) * SpaceStationAdjectives.length)];
    const name = SpaceStationNames[Math.floor(rng(sampleIndex + 1) * SpaceStationNames.length)];
    return `${name}${uniformRandBool(0.5, rng, sampleIndex + 2) ? "'s" : ""} ${adjective}`;
}

export function generateSpaceElevatorName(rng: (index: number) => number, sampleIndex: number) {
    const adjective = SpaceElevatorAdjectives[Math.floor(rng(sampleIndex) * SpaceElevatorAdjectives.length)];
    const name = SpaceStationNames[Math.floor(rng(sampleIndex + 1) * SpaceStationNames.length)];
    return `${name}${uniformRandBool(0.5, rng, sampleIndex + 2) ? "'s" : ""} ${adjective}`;
}
