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

export class LRUMap<K, V> {
    private readonly map = new Map<K, V>();

    private readonly maxSize: number;
    private readonly cleanup: (key: K, item: V) => void;

    public constructor(maxSize: number, cleanup: (key: K, item: V) => void = () => undefined) {
        if (maxSize < 1) {
            throw new Error("LRUMap maxSize must be greater than 0");
        }

        this.maxSize = maxSize;
        this.cleanup = cleanup;
    }

    public set(key: K, value: V): void {
        if (this.map.has(key)) {
            const existingValue = this.map.get(key) as V;
            if (existingValue !== value) {
                this.cleanup(key, existingValue);
            }
            this.map.delete(key);
        } else if (this.map.size >= this.maxSize) {
            const firstEntry = this.map.entries().next().value;
            if (firstEntry !== undefined) {
                const [firstKey, firstValue] = firstEntry;
                this.cleanup(firstKey, firstValue);
                this.map.delete(firstKey);
            }
        }

        this.map.set(key, value);
    }

    public get(key: K): V | undefined {
        if (!this.map.has(key)) {
            return undefined;
        }

        const value = this.map.get(key) as V;
        this.map.delete(key);
        this.map.set(key, value);

        return value;
    }

    public clear(): void {
        for (const [key, value] of this.map.entries()) {
            this.cleanup(key, value);
        }

        this.map.clear();
    }
}
