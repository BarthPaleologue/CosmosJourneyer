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

export enum StellarType {
    /** 30,000 - 50,000 K */
    O,
    /** 10,000 - 30,000 K */
    B,
    /** 7,500 - 10,000 K */
    A,
    /** 6,000 - 7,500 K */
    F,
    /** 5,000 - 6,000 K */
    G,
    /** 3,500 - 5,000 K */
    K,
    /** 2,700 - 3,500 K */
    M
}

export function getStellarTypeString(type: StellarType): string {
    switch (type) {
        case StellarType.O:
            return "O";
        case StellarType.B:
            return "B";
        case StellarType.A:
            return "A";
        case StellarType.F:
            return "F";
        case StellarType.G:
            return "G";
        case StellarType.K:
            return "K";
        case StellarType.M:
            return "M";
    }
}
