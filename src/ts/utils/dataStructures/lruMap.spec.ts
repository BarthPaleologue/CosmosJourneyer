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

import { describe, expect, test, vi } from "vitest";

import { LRUMap } from "./lruMap";

describe("LRUMap", () => {
    test("should initialize with correct max size", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(3, cleanup);

        // Set some values
        lru.set("a", 1);
        lru.set("b", 2);
        lru.set("c", 3);

        expect(cleanup).not.toHaveBeenCalled();
    });

    test("should store and retrieve values", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(3, cleanup);

        lru.set("key1", 100);
        lru.set("key2", 200);

        expect(lru.get("key1")).toBe(100);
        expect(lru.get("key2")).toBe(200);
        expect(lru.get("nonexistent")).toBeUndefined();
    });

    test("should evict least recently used item when capacity is exceeded", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(2, cleanup);

        lru.set("a", 1);
        lru.set("b", 2);
        lru.set("c", 3); // This should evict "a"

        expect(cleanup).toHaveBeenCalledWith("a", 1);
        expect(lru.get("a")).toBeUndefined();
        expect(lru.get("b")).toBe(2);
        expect(lru.get("c")).toBe(3);
    });

    test("should update LRU order when accessing items", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(2, cleanup);

        lru.set("a", 1);
        lru.set("b", 2);

        // Access "a" to make it most recently used
        lru.get("a");

        // Add "c", which should evict "b" (not "a")
        lru.set("c", 3);

        expect(cleanup).toHaveBeenCalledWith("b", 2);
        expect(lru.get("a")).toBe(1);
        expect(lru.get("b")).toBeUndefined();
        expect(lru.get("c")).toBe(3);
    });

    test("should update existing key without calling cleanup on same value", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(3, cleanup);

        lru.set("a", 1);
        lru.set("a", 1); // Same value

        expect(cleanup).not.toHaveBeenCalled();
        expect(lru.get("a")).toBe(1);
    });

    test("should call cleanup when updating existing key with different value", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(3, cleanup);

        lru.set("a", 1);
        lru.set("a", 2); // Different value

        expect(cleanup).toHaveBeenCalledWith("a", 1);
        expect(lru.get("a")).toBe(2);
    });

    test("should move updated key to most recent position", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(2, cleanup);

        lru.set("a", 1);
        lru.set("b", 2);
        lru.set("a", 10); // Update "a"
        lru.set("c", 3); // This should evict "b", not "a"

        expect(cleanup).toHaveBeenCalledWith("a", 1); // Cleanup old value of "a"
        expect(cleanup).toHaveBeenCalledWith("b", 2); // Cleanup evicted "b"
        expect(lru.get("a")).toBe(10);
        expect(lru.get("b")).toBeUndefined();
        expect(lru.get("c")).toBe(3);
    });

    test("should clear all items and call cleanup for each", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(3, cleanup);

        lru.set("a", 1);
        lru.set("b", 2);
        lru.set("c", 3);

        lru.clear();

        expect(cleanup).toHaveBeenCalledTimes(3);
        expect(cleanup).toHaveBeenCalledWith("a", 1);
        expect(cleanup).toHaveBeenCalledWith("b", 2);
        expect(cleanup).toHaveBeenCalledWith("c", 3);

        expect(lru.get("a")).toBeUndefined();
        expect(lru.get("b")).toBeUndefined();
        expect(lru.get("c")).toBeUndefined();
    });

    test("should handle single item capacity", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(1, cleanup);

        lru.set("a", 1);
        expect(lru.get("a")).toBe(1);

        lru.set("b", 2); // Should evict "a"
        expect(cleanup).toHaveBeenCalledWith("a", 1);
        expect(lru.get("a")).toBeUndefined();
        expect(lru.get("b")).toBe(2);
    });

    test("should work with different key and value types", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<number, string>(2, cleanup);

        lru.set(1, "one");
        lru.set(2, "two");

        expect(lru.get(1)).toBe("one");
        expect(lru.get(2)).toBe("two");

        lru.set(3, "three");
        expect(cleanup).toHaveBeenCalledWith(1, "one");
    });

    test("should handle complex objects as values", () => {
        interface TestObject {
            id: number;
            name: string;
        }

        const cleanup = vi.fn();
        const lru = new LRUMap<string, TestObject>(2, cleanup);

        const obj1 = { id: 1, name: "Object 1" };
        const obj2 = { id: 2, name: "Object 2" };
        const obj3 = { id: 3, name: "Object 3" };

        lru.set("obj1", obj1);
        lru.set("obj2", obj2);
        lru.set("obj3", obj3); // Should evict obj1

        expect(cleanup).toHaveBeenCalledWith("obj1", obj1);
        expect(lru.get("obj1")).toBeUndefined();
        expect(lru.get("obj2")).toEqual(obj2);
        expect(lru.get("obj3")).toEqual(obj3);
    });

    test("should maintain correct order with mixed operations", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(3, cleanup);

        // Fill the cache
        lru.set("a", 1);
        lru.set("b", 2);
        lru.set("c", 3);

        // Access items in different order
        lru.get("a"); // a becomes most recent
        lru.get("b"); // b becomes most recent

        // Add new item, should evict "c" (least recently used)
        lru.set("d", 4);

        expect(cleanup).toHaveBeenCalledWith("c", 3);
        expect(lru.get("a")).toBe(1);
        expect(lru.get("b")).toBe(2);
        expect(lru.get("c")).toBeUndefined();
        expect(lru.get("d")).toBe(4);
    });

    test("should handle accessing non-existent keys without errors", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(3, cleanup);

        expect(lru.get("nonexistent")).toBeUndefined();
        expect(cleanup).not.toHaveBeenCalled();

        lru.set("a", 1);
        expect(lru.get("nonexistent")).toBeUndefined();
        expect(lru.get("a")).toBe(1);
    });
});
