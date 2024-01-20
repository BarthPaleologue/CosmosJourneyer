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

const constellationNames: string[] = [
    "Andromeda",
    "Antlia",
    "Apus",
    "Aquarius",
    "Aquila",
    "Ara",
    "Aries",
    "Ashton",
    "Auriga",
    "Boötes",
    "Barnard",
    "Berenices",
    "Bode",
    "Bottlinger",
    "Botes",
    "Caela",
    "Caeli",
    "Caelum",
    "Camelopardalis",
    "Cancer",
    "Canes Venatici",
    "Canis",
    "Carter",
    "Capricornus",
    "Cassiopeia",
    "Centaurus",
    "Cepheus",
    "Cetus",
    "Chamaeleon",
    "Circinus",
    "Columba",
    "Corona",
    "Corvus",
    "Crater",
    "Crux",
    "Cygnus",
    "Delphinus",
    "Dorado",
    "Draco",
    "Equuleus",
    "Eridanus",
    "Fornax",
    "Gemini",
    "Grus",
    "Hades",
    "Hercules",
    "Horologium",
    "Hydra",
    "Hydrus",
    "Indus",
    "Kozuch",
    "Lacerta",
    "Laval",
    "Leo",
    "Lepus",
    "Libra",
    "Lupus",
    "Lynx",
    "Lyra",
    "Mensa",
    "Microscopium",
    "Monoceros",
    "Musca",
    "Norma",
    "Octans",
    "Ophiuchus",
    "Orion",
    "Pavo",
    "Pegasus",
    "Perseus",
    "Phoenix",
    "Pictor",
    "Pisces",
    "Puppis",
    "Pyxis",
    "Reticulum",
    "Sagitta",
    "Sagittarius",
    "Scorpius",
    "Sculptor",
    "Scutum",
    "Serpens",
    "Sextans",
    "Taurus",
    "Telescopium",
    "Triangulum",
    "Tucana",
    "Ursa",
    "Vela",
    "Virgo",
    "Volans",
    "Vulpecula",
    "Weierstrass",
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
    return `${constellation} ${greekLetter}`;
}
