//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

/** Any storable value: anything except `undefined` and `null`, which `get` could not distinguish from a missing key. */
type StoredValue = string | number | bigint | boolean | symbol | object;

/**
 * `V` must not include `undefined` (nor `null`): a stored `undefined` would be indistinguishable
 * from a missing key in `get`, breaking the recency refresh. The constraint turns that into a
 * compile-time error at the `set` call site instead of a silent LRU bug.
 */
export class LRUMap<K, V extends StoredValue> {
    private readonly map = new Map<K, V>();

    private readonly maxSize: number;

    public constructor(maxSize: number) {
        if (maxSize < 1) {
            throw new Error("LRUMap maxSize must be greater than 0");
        }

        this.maxSize = maxSize;
    }

    public set(key: K, value: V): void {
        if (this.map.has(key)) {
            this.map.delete(key);
        } else if (this.map.size >= this.maxSize) {
            const first = this.map.keys().next();
            if (first.done !== true) {
                this.map.delete(first.value);
            }
        }

        this.map.set(key, value);
    }

    public get(key: K): V | undefined {
        const value = this.map.get(key);
        if (value === undefined) {
            return undefined;
        }

        this.map.delete(key);
        this.map.set(key, value);

        return value;
    }

    public clear(): void {
        this.map.clear();
    }
}
