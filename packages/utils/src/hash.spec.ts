// Tests for hash utility functions

import { describe, expect, it } from "vitest";

import { hashArray } from "./hash";

describe("hashArray", () => {
    it("should return a number between 0 and 1", () => {
        const result = hashArray([1, 2, 3]);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
    });

    it("should return the same hash for the same input array", () => {
        const hash1 = hashArray([42, 123, 789]);
        const hash2 = hashArray([42, 123, 789]);
        expect(hash1).toEqual(hash2);
    });

    it("should return different hashes for different arrays", () => {
        const hash1 = hashArray([1, 2, 3]);
        const hash2 = hashArray([3, 2, 1]);
        expect(hash1).not.toEqual(hash2);
    });

    it("should handle empty arrays", () => {
        const result = hashArray([]);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
        // Empty array should produce consistent result
        expect(result).toEqual(hashArray([]));
    });

    it("should handle arrays with negative numbers", () => {
        const result = hashArray([-1, -5, -10]);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
    });

    it("should handle arrays with decimal numbers", () => {
        const result = hashArray([1.5, 2.7, 3.14]);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
    });

    it("should handle arrays with large numbers", () => {
        const result = hashArray([Number.MAX_SAFE_INTEGER, 1000000, 9999999]);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
    });

    it("should produce different values for arrays with different orders", () => {
        const hash1 = hashArray([1, 2, 3]);
        const hash2 = hashArray([1, 3, 2]);
        const hash3 = hashArray([2, 1, 3]);

        expect(hash1).not.toEqual(hash2);
        expect(hash1).not.toEqual(hash3);
        expect(hash2).not.toEqual(hash3);
    });
});
