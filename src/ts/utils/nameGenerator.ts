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

/**
 * @see https://en.wikipedia.org/wiki/List_of_proper_names_of_stars
 */
const constellationNames: string[] = [
    "Andromedae",
    "Antliae",
    "Apodis",
    "Aquarii",
    "Aquilae",
    "Arae",
    "Archimediae",
    "Arii",
    "Aurigae",
    "Azophi",
    "Barnard",
    "Berenices",
    "Boötis",
    "Botes",
    "Caeli",
    "Cameliae",
    "Cancri",
    "Canesis",
    "Cannonis",
    "Canis",
    "Carteri",
    "Capricorni",
    "Carinae",
    "Cassini",
    "Cassiopeiae",
    "Centauri",
    "Cephei",
    "Ceti",
    "Circini",
    "Columbae",
    "Comae",
    "Conway",
    "Copernici",
    "Coronae",
    "Corvi",
    "Crucis",
    "Curi",
    "Cygni",
    "Darwini",
    "Da Vinci",
    "Delphini",
    "Descartes",
    "Dijkstrae",
    "Draconis",
    "Drakes",
    "Eich",
    "Einsteini",
    "Equulei",
    "Eratosthenis",
    "Eridani",
    "Euclidae",
    "Euleris",
    "Europae",
    "Fornacis",
    "Gaussi",
    "Galilei",
    "Geminorum",
    "Hamiltoni",
    "Hawking",
    "Hercules",
    "Herschel",
    "Hopperae",
    "Horologium",
    "Hubblis",
    "Huygentis",
    "Hyades",
    "Hydri",
    "Hypatiae",
    "Indi",
    "Kapteyni",
    "Kepleris",
    "Lacertae",
    "Leavitis",
    "Leonis",
    "Lepi",
    "Librae",
    "Lovelace",
    "Lupi",
    "Lyncis",
    "Lyrae",
    "Mensae",
    "Messier",
    "Mobii",
    "Muscae",
    "Neumanni",
    "Newtonis",
    "Normae",
    "Norma",
    "Octantis",
    "Ophiuchi",
    "Orionis",
    "Pavonis",
    "Pegasi",
    "Persei",
    "Phoenicis",
    "Pictoris",
    "Piscium",
    "Ptolemæi",
    "Puppis",
    "Pythagorae",
    "Reticuli",
    "Saganis",
    "Sagittae",
    "Sagittarii",
    "Scorpii",
    "Sculptoris",
    "Scuti",
    "Serpentinis",
    "Sextantis",
    "Tauri",
    "Telescopii",
    "Torvaldi",
    "Trianguli",
    "Tucanae",
    "Turingi",
    "Ursae",
    "Velae",
    "Virginis",
    "Volantis",
    "Vulpecula",
    "Weierstrass",
    "Zeno",
    "Zimmerman"
];

const greekLetters: string[] = [
    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
    "Epsilon",
    "Zeta",
    "Eta",
    "Theta",
    "Iota",
    "Kappa",
    "Lambda",
    "Mu",
    "Nu",
    "Xi",
    "Omicron",
    "Pi",
    "Rho",
    "Sigma",
    "Tau",
    "Upsilon",
    "Phi",
    "Chi",
    "Psi",
    "Omega"
];

export function romanNumeral(n: number): string {
    switch (n) {
        case 1:
            return "I";
        case 2:
            return "II";
        case 3:
            return "III";
        case 4:
            return "IV";
        case 5:
            return "V";
        case 6:
            return "VI";
        case 7:
            return "VII";
        case 8:
            return "VIII";
        case 9:
            return "IX";
        case 10:
            return "X";
        default:
            return n.toString();
    }
}

export function generateName(rng: (step: number) => number, baseStep = 0): string {
    const constellation = constellationNames[Math.floor(rng(baseStep) * constellationNames.length)];
    const greekLetter = greekLetters[Math.floor(rng(baseStep + 1) * greekLetters.length)];
    return `${greekLetter} ${constellation}`;
}
