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
const parentIndex = (i: number): number => ((i + 1) >>> 1) - 1;
const leftIndex = (i: number): number => (i << 1) + 1;
const rightIndex = (i: number): number => (i + 1) << 1;

/** Priority queue whose comparator selects the element returned first. */
export class PriorityQueue<T> {
    readonly #heap: T[];
    readonly #comparator: (a: T, b: T) => boolean;

    constructor(comparator: (a: T, b: T) => boolean) {
        this.#heap = [];
        this.#comparator = comparator;
    }

    /** @returns Number of elements currently in the queue. */
    size(): number {
        return this.#heap.length;
    }

    /** @returns Whether the queue contains no elements. */
    isEmpty(): boolean {
        return this.size() === 0;
    }

    /** @returns The next element according to the comparator, or `undefined` when empty. */
    peek(): T | undefined {
        return this.#heap[topIndex];
    }

    /**
     * Adds elements to the queue and restores heap order after each insertion.
     * @param values Elements to enqueue.
     * @returns The queue's new size.
     */
    push(...values: T[]): number {
        values.forEach((value) => {
            this.#heap.push(value);
            this.#siftUp();
        });
        return this.size();
    }

    /** @returns Removes and returns the next element, or `undefined` when empty. */
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

    /** Removes all queued elements. */
    clear(): void {
        this.#heap.length = 0;
    }

    /**
     * Finds an element in the heap array without changing queue order.
     * @param predicate Test applied to each queued value.
     * @returns The first matching value in heap storage order, or `undefined` if none matches.
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
