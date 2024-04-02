//  This file is part of Cosmos Journeyer
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

export const SpaceStationNames: string[] = [
    "Aldrin",
    "Apollo",
    "Armstrong",
    "Asimov",
    "Babbage",
    "Blinn",
    "Boole",
    "Catmull",
    "Clark",
    "Clarke",
    "Curie",
    "Einstein",
    "Feynman",
    "Gagarin",
    "Galileo",
    "Gauss",
    "Gemini",
    "Gouraud",
    "Hawking",
    "Heinlein",
    "Herbert",
    "Kubrick",
    "Laika",
    "Lovelace",
    "Mercury",
    "Newton",
    "Pascal",
    "Phong",
    "Picard",
    "Rayleigh",
    "Stanford",
    "Sutherland",
    "Suzanne",
    "Tolkien",
    "Tolstoy",
    "Torvalds",
    "Turing",
    "Von Neumann"
];

export const SpaceStationAdjectives: string[] = [
    "'s Abode",
    "'s Bar",
    "'s Colony",
    "'s Discovery",
    "'s Endeavour",
    "'s Enterprise",
    "'s Frontier",
    "Habitat",
    "Haven",
    "Interstellar",
    "'s Journey",
    "Laboratory",
    "Orbital",
    "Outpost",
    "'s Prospect",
    "'s Prosperity",
    "'s Refuge",
    "'s Sanctuary",
    "Settlement",
    "Station",
    "'s Tranquility",
    "'s Unity",
    "'s Vision"
];

/**
 * Generate a space station name using a noise based rng and a given sample index
 * @param rng The noise based rng with a range of [0, 1]
 * @param sampleIndex The index of the sample to generate
 */
export function generateSpaceStationName(rng: (index: number) => number, sampleIndex: number) {
    const adjective = SpaceStationAdjectives[Math.floor(rng(sampleIndex) * SpaceStationAdjectives.length)];
    const name = SpaceStationNames[Math.floor(rng(sampleIndex + 1) * SpaceStationNames.length)];
    return `${name} ${adjective}`;
}
