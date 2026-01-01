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

export type IllustriousFigure = {
    firstName?: string;
    lastName: string;
    tags: ReadonlySet<Tag>;
};

export type Tag =
    | "physics"
    | "mathematics"
    | "engineering"
    | "chemistry"
    | "biology"
    | "astronomy"
    | "computer_science"
    | "spaceflight"
    | "literature"
    | "science_fiction"
    | "fantasy"
    | "film"
    | "computer_graphics"
    | "medicine"
    | "philosophy"
    | "politics";

/**
 * A list of illustrious figures (fictional or real) that make us proud to be human:
 * those who exemplify human excellence through understanding, restraint, curiosity, responsibility, and long-term thinking.
 * Currently living figures are excluded to avoid controversies.
 * This list is not exhaustive and will be expanded over time.
 */
export const IllustriousFigures = [
    { lastName: "Al-Khwarizmi", firstName: "Muhammad", tags: new Set(["mathematics", "computer_science"]) },
    { lastName: "Aristotle", tags: new Set(["philosophy"]) },
    { lastName: "Archimedes", tags: new Set(["mathematics", "physics", "engineering"]) },
    { lastName: "Armstrong", firstName: "Neil", tags: new Set(["spaceflight"]) },
    { lastName: "Arroway", firstName: "Ellie", tags: new Set(["astronomy"]) },
    { lastName: "Asimov", firstName: "Isaac", tags: new Set(["literature", "science_fiction"]) },
    {
        lastName: "Babbage",
        firstName: "Charles",
        tags: new Set(["engineering", "mathematics", "computer_science"]),
    },
    { lastName: "Aurelius", firstName: "Marcus", tags: new Set(["philosophy", "politics"]) },
    { lastName: "Bohr", firstName: "Niels", tags: new Set(["physics"]) },
    { lastName: "Boole", firstName: "George", tags: new Set(["mathematics", "computer_science"]) },
    { lastName: "Bradbury", firstName: "Ray", tags: new Set(["literature", "science_fiction"]) },
    { lastName: "Calvin", firstName: "Susan", tags: new Set(["engineering"]) },
    { lastName: "Cantor", firstName: "Georg", tags: new Set(["mathematics"]) },
    { lastName: "Cicero", firstName: "Marcus Tullius", tags: new Set(["philosophy", "politics"]) },
    { lastName: "Clarke", firstName: "Arthur C.", tags: new Set(["literature", "science_fiction"]) },
    { lastName: "Conway", firstName: "John Horton", tags: new Set(["mathematics", "computer_science"]) },
    { lastName: "Copernicus", firstName: "Nicolaus", tags: new Set(["astronomy", "mathematics"]) },
    { lastName: "Curie", firstName: "Marie", tags: new Set(["chemistry", "physics"]) },
    { lastName: "Darwin", firstName: "Charles", tags: new Set(["biology"]) },
    { lastName: "Descartes", firstName: "René", tags: new Set(["philosophy", "mathematics"]) },
    { lastName: "Dijkstra", firstName: "Edsger", tags: new Set(["computer_science", "mathematics"]) },
    { lastName: "Dirac", firstName: "Paul", tags: new Set(["physics"]) },
    { lastName: "Einstein", firstName: "Albert", tags: new Set(["physics"]) },
    { lastName: "Euclid", tags: new Set(["mathematics"]) },
    { lastName: "Euler", firstName: "Leonhard", tags: new Set(["mathematics", "physics"]) },
    { lastName: "Faraday", firstName: "Michael", tags: new Set(["physics", "chemistry"]) },
    { lastName: "Fermat", firstName: "Pierre", tags: new Set(["mathematics"]) },
    { lastName: "Fermi", firstName: "Enrico", tags: new Set(["physics"]) },
    { lastName: "Feynman", firstName: "Richard", tags: new Set(["physics"]) },
    { lastName: "Fibonacci", firstName: "Leonardo", tags: new Set(["mathematics"]) },
    { lastName: "Franklin", firstName: "Benjamin", tags: new Set(["physics", "engineering", "politics"]) },
    { lastName: "Franklin", firstName: "Rosalind", tags: new Set(["biology", "chemistry"]) },
    { lastName: "Gagarin", firstName: "Yuri", tags: new Set(["spaceflight"]) },
    { lastName: "Galileo", tags: new Set(["astronomy", "physics"]) },
    { lastName: "Galois", firstName: "Évariste", tags: new Set(["mathematics"]) },
    { lastName: "Gauss", firstName: "Carl", tags: new Set(["mathematics", "physics"]) },
    { lastName: "Glenn", firstName: "John", tags: new Set(["spaceflight"]) },
    { lastName: "Gödel", firstName: "Kurt", tags: new Set(["mathematics"]) },
    { lastName: "Goodall", firstName: "Jane", tags: new Set(["biology"]) },
    { lastName: "Hawking", firstName: "Stephen", tags: new Set(["physics", "astronomy"]) },
    { lastName: "Heinlein", firstName: "Robert", tags: new Set(["literature", "science_fiction"]) },
    { lastName: "Heisenberg", firstName: "Werner", tags: new Set(["physics"]) },
    { lastName: "Herbert", firstName: "Frank", tags: new Set(["literature", "science_fiction"]) },
    { lastName: "Herschel", firstName: "William", tags: new Set(["astronomy", "physics"]) },
    { lastName: "Hilbert", firstName: "David", tags: new Set(["mathematics"]) },
    { lastName: "Hippocrates", tags: new Set(["biology", "medicine"]) },
    { lastName: "Holden", firstName: "James", tags: new Set(["spaceflight", "science_fiction"]) },
    { lastName: "Hopper", firstName: "Grace", tags: new Set(["computer_science", "engineering"]) },
    { lastName: "Hubble", firstName: "Edwin", tags: new Set(["astronomy"]) },
    { lastName: "Huygens", firstName: "Christiaan", tags: new Set(["astronomy", "physics", "mathematics"]) },
    { lastName: "Hypatia", tags: new Set(["mathematics", "philosophy"]) },
    { lastName: "Kant", firstName: "Immanuel", tags: new Set(["philosophy"]) },
    { lastName: "Kepler", firstName: "Johannes", tags: new Set(["astronomy", "mathematics"]) },
    { lastName: "Korolev", firstName: "Sergei", tags: new Set(["engineering", "spaceflight"]) },
    { lastName: "Kubrick", firstName: "Stanley", tags: new Set(["film", "science_fiction"]) },
    { lastName: "Lagrange", firstName: "Joseph-Louis", tags: new Set(["mathematics", "physics"]) },
    { lastName: "Laplace", firstName: "Pierre-Simon", tags: new Set(["mathematics", "physics"]) },
    { lastName: "Lincoln", firstName: "Abraham", tags: new Set(["politics"]) },
    { lastName: "Lovelace", firstName: "Ada", tags: new Set(["mathematics", "computer_science"]) },
    { lastName: "Maxwell", firstName: "James Clerk", tags: new Set(["physics"]) },
    { lastName: "Meitner", firstName: "Lise", tags: new Set(["physics", "chemistry"]) },
    { lastName: "Mendeleev", firstName: "Dmitri", tags: new Set(["chemistry"]) },
    { lastName: "Montesquieu", tags: new Set(["philosophy", "politics"]) },
    { lastName: "Newton", firstName: "Isaac", tags: new Set(["physics", "mathematics"]) },
    { lastName: "Noether", firstName: "Emmy", tags: new Set(["mathematics", "physics"]) },
    { lastName: "Pascal", firstName: "Blaise", tags: new Set(["mathematics", "physics"]) },
    { lastName: "Pasteur", firstName: "Louis", tags: new Set(["biology", "chemistry", "medicine"]) },
    { lastName: "Phong", firstName: "Bui Tuong", tags: new Set(["computer_graphics", "engineering"]) }, // We use lastName: "Phong" as the naming token (conventional in CG), even though his family name is Bùi Tường.
    { lastName: "Picard", firstName: "Jean-Luc", tags: new Set(["spaceflight", "science_fiction"]) },
    { lastName: "Planck", firstName: "Max", tags: new Set(["physics"]) },
    { lastName: "Plato", tags: new Set(["philosophy", "mathematics"]) },
    { lastName: "Poincaré", firstName: "Henri", tags: new Set(["mathematics", "physics"]) },
    { lastName: "Pratchett", firstName: "Terry", tags: new Set(["literature", "fantasy"]) },
    { lastName: "Pythagoras", tags: new Set(["mathematics"]) },
    { lastName: "Ramanujan", firstName: "Srinivasa", tags: new Set(["mathematics"]) },
    { lastName: "Rayleigh", firstName: "John", tags: new Set(["physics"]) },
    { lastName: "Ripley", firstName: "Ellen", tags: new Set(["science_fiction"]) },
    { lastName: "Rousseau", firstName: "Jean-Jacques", tags: new Set(["philosophy", "politics"]) },
    { lastName: "Sagan", firstName: "Carl", tags: new Set(["astronomy", "science_fiction"]) },
    { lastName: "Seldon", firstName: "Hari", tags: new Set(["science_fiction", "politics"]) },
    { lastName: "Schrödinger", firstName: "Erwin", tags: new Set(["physics"]) },
    { lastName: "Shakespeare", firstName: "William", tags: new Set(["literature"]) },
    { lastName: "Shannon", firstName: "Claude", tags: new Set(["mathematics", "computer_science"]) },
    { lastName: "Tesla", firstName: "Nikola", tags: new Set(["engineering", "physics"]) },
    { lastName: "Tolkien", firstName: "J.R.R.", tags: new Set(["literature", "fantasy"]) },
    { lastName: "Tolstoy", firstName: "Leo", tags: new Set(["literature"]) },
    { lastName: "Turing", firstName: "Alan", tags: new Set(["mathematics", "computer_science"]) },
    { lastName: "Verne", firstName: "Jules", tags: new Set(["literature", "science_fiction"]) },
    { lastName: "Voltaire", tags: new Set(["philosophy", "politics"]) },
    { lastName: "Von Neumann", firstName: "John", tags: new Set(["mathematics", "computer_science"]) },
    { lastName: "Watney", firstName: "Mark", tags: new Set(["engineering", "spaceflight", "biology"]) },
] as const satisfies ReadonlyArray<IllustriousFigure>;
