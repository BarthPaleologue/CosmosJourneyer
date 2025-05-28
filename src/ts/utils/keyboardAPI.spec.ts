import { afterEach, describe, expect, it, vi } from "vitest";

import { getGlobalKeyboardLayoutMap } from "./keyboardAPI";

describe("getGlobalKeyboardLayoutMap", () => {
    const originalNavigator = global.navigator;
    const mockMap = new Map([
        ["KeyA", "a"],
        ["KeyB", "b"],
    ]);
    const mockGetLayoutMap = vi.fn().mockResolvedValue(mockMap);

    afterEach(() => {
        vi.restoreAllMocks();
        // Restore the original navigator
        Object.defineProperty(global, "navigator", {
            value: originalNavigator,
            writable: true,
        });
    });

    it("should return keyboard layout map when navigator.keyboard and getLayoutMap are available", async () => {
        // Mock navigator.keyboard with getLayoutMap function
        Object.defineProperty(global, "navigator", {
            value: {
                keyboard: {
                    getLayoutMap: mockGetLayoutMap,
                },
            },
            writable: true,
        });

        const result = await getGlobalKeyboardLayoutMap();

        expect(mockGetLayoutMap).toHaveBeenCalledTimes(1);
        expect(result).toBe(mockMap);
    });

    it("should return null when navigator.keyboard exists but getLayoutMap is undefined", async () => {
        // Mock navigator.keyboard without getLayoutMap
        Object.defineProperty(global, "navigator", {
            value: {
                keyboard: {
                    getLayoutMap: undefined,
                },
            },
            writable: true,
        });

        const result = await getGlobalKeyboardLayoutMap();

        expect(result).toBe(null);
    });

    it("should return null when navigator.keyboard is undefined", async () => {
        // Mock navigator without keyboard
        Object.defineProperty(global, "navigator", {
            value: {
                keyboard: undefined,
            },
            writable: true,
        });

        const result = await getGlobalKeyboardLayoutMap();

        expect(result).toBe(null);
    });
});
