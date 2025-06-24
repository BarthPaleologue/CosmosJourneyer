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

export class LRUMap<K, V> {
    private readonly map: Map<K, V>;
    private readonly maxSize: number;

    private readonly cleanup: (key: K, item: V) => void;

    constructor(maxSize: number, cleanup: (key: K, item: V) => void) {
        this.map = new Map<K, V>();
        this.maxSize = maxSize;

        this.cleanup = cleanup;
    }

    public set(key: K, value: V): void {
        const existingValue = this.map.get(key);
        if (existingValue !== undefined) {
            if (existingValue !== value) {
                this.cleanup(key, existingValue); // Clean up the existing value if it exists
            }
            this.map.delete(key); // Remove the existing entry to update its position
        } else if (this.map.size >= this.maxSize) {
            // Remove the oldest entry (the first one in insertion order)
            const firstEntry = this.map.entries().next().value;
            if (firstEntry !== undefined) {
                this.cleanup(firstEntry[0], firstEntry[1]);
                this.map.delete(firstEntry[0]);
            }
        }

        this.map.set(key, value); // Add the new or updated entry
    }

    public get(key: K): V | undefined {
        if (!this.map.has(key)) {
            return undefined; // Key not found
        }

        this.touch(key); // Mark the key as most recently used
        return this.map.get(key); // Return the value
    }

    /**
     * Deletes the key from the map and re-adds it, effectively marking it as the most recently used.
     * This is useful for implementing a Least Recently Used (LRU) cache mechanism.
     * @param key The key to touch, marking it as the most recently used.
     */
    private touch(key: K): void {
        const val = this.map.get(key);
        if (val !== undefined) {
            this.map.delete(key); // O(1)
            this.map.set(key, val); // now key is the newest
        }
    }

    public clear(): void {
        for (const [key, value] of this.map.entries()) {
            this.cleanup(key, value); // Clean up each value before clearing the map
        }

        this.map.clear(); // Clear the map
    }
}
