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

// based on the solution of https://stackoverflow.com/questions/42919469/efficient-way-to-implement-priority-queue-in-javascript

const topIndex = 0;
const parentIndex = (i: number) => ((i + 1) >>> 1) - 1;
const leftIndex = (i: number) => (i << 1) + 1;
const rightIndex = (i: number) => (i + 1) << 1;

/**
 * Priority queue implementation using a binary heap
 */
export class PriorityQueue<T> {
    readonly #heap: T[];
    readonly #comparator: (a: T, b: T) => boolean;

    constructor(comparator: (a: T, b: T) => boolean) {
        this.#heap = [];
        this.#comparator = comparator;
    }

    /**
     * Returns the number of elements in the queue
     */
    size(): number {
        return this.#heap.length;
    }

    /**
     * Returns true if the queue is empty, false otherwise
     */
    isEmpty(): boolean {
        return this.size() === 0;
    }

    /**
     * Returns the element at the top of the queue, without removing it from the queue
     */
    peek(): T | undefined {
        return this.#heap[topIndex];
    }

    /**
     * Adds one or more elements to the queue
     * @param values The elements to add to the queue
     * @returns The new size of the queue
     */
    push(...values: T[]): number {
        values.forEach((value) => {
            this.#heap.push(value);
            this.#siftUp();
        });
        return this.size();
    }

    /**
     * Removes and returns the element at the top of the queue
     */
    pop(): T | undefined {
        const poppedValue = this.peek();
        const bottom = this.size() - 1;
        if (bottom > topIndex) {
            this.#swap(topIndex, bottom);
        }
        this.#heap.pop();
        this.#siftDown();
        return poppedValue;
    }

    /**
     * Removes all elements from the queue
     */
    clear(): void {
        this.#heap.length = 0;
    }

    /**
     * Returns the first element in the queue that satisfies the provided testing function. Otherwise, undefined is returned.
     * @param predicate A function to test each element of the queue
     */
    find(predicate: (value: T) => boolean): T | undefined {
        return this.#heap.find(predicate);
    }

    #greater(i: number, j: number): boolean {
        if (this.#heap[i] === undefined || this.#heap[j] === undefined) {
            return false;
        }

        return this.#comparator(this.#heap[i], this.#heap[j]);
    }

    #swap(i: number, j: number): void {
        if (this.#heap[i] === undefined || this.#heap[j] === undefined) {
            return;
        }

        [this.#heap[i], this.#heap[j]] = [this.#heap[j], this.#heap[i]];
    }

    #siftUp(): void {
        let node = this.size() - 1;
        while (node > topIndex && this.#greater(node, parentIndex(node))) {
            this.#swap(node, parentIndex(node));
            node = parentIndex(node);
        }
    }

    #siftDown(): void {
        let node = topIndex;
        while (
            (leftIndex(node) < this.size() && this.#greater(leftIndex(node), node)) ||
            (rightIndex(node) < this.size() && this.#greater(rightIndex(node), node))
        ) {
            const maxChild =
                rightIndex(node) < this.size() && this.#greater(rightIndex(node), leftIndex(node))
                    ? rightIndex(node)
                    : leftIndex(node);
            this.#swap(node, maxChild);
            node = maxChild;
        }
    }
}
