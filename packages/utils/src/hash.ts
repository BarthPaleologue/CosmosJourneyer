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

export function hashVec3(x: number, y: number, z: number): number {
    const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);

    const n = 1000000000;
    return hash % n;
}

export function hashArray(arr: ReadonlyArray<number>): number {
    // FNV-1a 32-bit parameters
    let hash = 0x811c9dc5; // FNV offset basis
    const FNV_PRIME = 0x01000193; // 16777619

    for (const num of arr) {
        // Mix in the value
        hash ^= num;
        // 32-bit multiply with C semantics
        hash = Math.imul(hash, FNV_PRIME);
    }

    // Force unsigned 32-bit and normalize to [0,1]
    hash >>>= 0;
    return hash / 0xffffffff;
}
