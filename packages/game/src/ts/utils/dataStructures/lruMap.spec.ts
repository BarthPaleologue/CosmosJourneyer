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
    test("stores and retrieves values", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(3, cleanup);

        lru.set("key1", 100);
        lru.set("key2", 200);

        expect(lru.get("key1")).toBe(100);
        expect(lru.get("key2")).toBe(200);
        expect(lru.get("nonexistent")).toBeUndefined();
        expect(cleanup).not.toHaveBeenCalled();
    });

    test("evicts the least recently used item when capacity is exceeded", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(2, cleanup);

        lru.set("a", 1);
        lru.set("b", 2);
        lru.set("c", 3);

        expect(cleanup).toHaveBeenCalledWith("a", 1);
        expect(lru.get("a")).toBeUndefined();
        expect(lru.get("b")).toBe(2);
        expect(lru.get("c")).toBe(3);
    });

    test("updates LRU order when accessing items", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(2, cleanup);

        lru.set("a", 1);
        lru.set("b", 2);
        lru.get("a");
        lru.set("c", 3);

        expect(cleanup).toHaveBeenCalledWith("b", 2);
        expect(lru.get("a")).toBe(1);
        expect(lru.get("b")).toBeUndefined();
        expect(lru.get("c")).toBe(3);
    });

    test("cleans up old values when updating an existing key", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number>(3, cleanup);

        lru.set("a", 1);
        lru.set("a", 2);

        expect(cleanup).toHaveBeenCalledWith("a", 1);
        expect(lru.get("a")).toBe(2);
    });

    test("clears all items and calls cleanup for each", () => {
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
    });

    test("supports undefined values", () => {
        const cleanup = vi.fn();
        const lru = new LRUMap<string, number | undefined>(1, cleanup);

        lru.set("a", undefined);
        expect(lru.get("a")).toBeUndefined();

        lru.set("b", 2);
        expect(cleanup).toHaveBeenCalledWith("a", undefined);
    });
});
