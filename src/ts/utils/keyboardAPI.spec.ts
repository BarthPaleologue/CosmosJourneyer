import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getGlobalKeyboardLayoutMap } from "./keyboardAPI";

describe("getGlobalKeyboardLayoutMap", () => {
    const originalNavigator = global.navigator;
    const mockMap = new Map([
        ["KeyA", "a"],
        ["KeyB", "b"],
    ]);
    const mockGetLayoutMap = vi.fn().mockResolvedValue(mockMap);
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

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
        expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should return empty map when navigator.keyboard exists but getLayoutMap is undefined", async () => {
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

        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(0);
        expect(consoleWarnSpy).toHaveBeenCalledWith("navigator.keyboard is not available, returning an empty map");
    });

    it("should return empty map when navigator.keyboard is undefined", async () => {
        // Mock navigator without keyboard
        Object.defineProperty(global, "navigator", {
            value: {
                keyboard: undefined,
            },
            writable: true,
        });

        const result = await getGlobalKeyboardLayoutMap();

        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(0);
        expect(consoleWarnSpy).toHaveBeenCalledWith("navigator.keyboard is not available, returning an empty map");
    });
});
