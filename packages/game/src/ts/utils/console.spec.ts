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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createConsoleDumper } from "./console";

// Interface to help us type the console methods properly
type ConsoleMethodType = (...args: unknown[]) => void;

describe("Console Dumper", () => {
    // Original console methods
    let originalLog: ConsoleMethodType;
    let originalInfo: ConsoleMethodType;
    let originalWarn: ConsoleMethodType;
    let originalError: ConsoleMethodType;
    let originalDebug: ConsoleMethodType;

    // Mock date implementation
    const mockDate = new Date("2023-01-01T12:00:00.000Z");
    // Using a more specific type that works with Vitest's spy implementation
    let dateNowSpy: { mockRestore: () => void };

    beforeEach(() => {
        // Store original console methods before each test
        originalLog = console.log;
        originalInfo = console.info;
        originalWarn = console.warn;
        originalError = console.error;
        originalDebug = console.debug;

        // Mock Date.now() and new Date() to return consistent timestamps
        dateNowSpy = vi.spyOn(global, "Date").mockImplementation(() => mockDate);
    });

    afterEach(() => {
        // Restore original console methods after each test
        console.log = originalLog;
        console.info = originalInfo;
        console.warn = originalWarn;
        console.error = originalError;
        console.debug = originalDebug;

        // Restore date implementation
        dateNowSpy.mockRestore();
    });

    test("should create a dumper function", () => {
        const dumpConsole = createConsoleDumper();
        expect(dumpConsole).toBeInstanceOf(Function);
    });

    test("should capture console.log messages", () => {
        const dumpConsole = createConsoleDumper();

        console.log("Test log message");

        const logs = dumpConsole();

        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
            level: "log",
            timestamp: mockDate.toISOString(),
            message: '"Test log message"',
        });
    });

    test("should capture console.info messages", () => {
        const dumpConsole = createConsoleDumper();

        console.info("Test info message");

        const logs = dumpConsole();

        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
            level: "info",
            timestamp: mockDate.toISOString(),
            message: '"Test info message"',
        });
    });

    test("should capture console.warn messages", () => {
        const dumpConsole = createConsoleDumper();

        console.warn("Test warning message");

        const logs = dumpConsole();

        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
            level: "warn",
            timestamp: mockDate.toISOString(),
            message: '"Test warning message"',
        });
    });

    test("should capture console.error messages", () => {
        const dumpConsole = createConsoleDumper();

        console.error("Test error message");

        const logs = dumpConsole();

        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
            level: "error",
            timestamp: mockDate.toISOString(),
            message: '"Test error message"',
        });
    });

    test("should capture console.debug messages", () => {
        const dumpConsole = createConsoleDumper();

        console.debug("Test debug message");

        const logs = dumpConsole();

        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
            level: "debug",
            timestamp: mockDate.toISOString(),
            message: '"Test debug message"',
        });
    });

    test("should capture multiple arguments", () => {
        const dumpConsole = createConsoleDumper();

        console.log("First arg", 123, { key: "value" });

        const logs = dumpConsole();

        expect(logs).toHaveLength(1);
        expect(logs[0]?.message).toBe('"First arg" 123 {"key":"value"}');
    });

    test("should handle circular references gracefully", () => {
        const dumpConsole = createConsoleDumper();

        const circular: Record<string, unknown> = { name: "circular object" };
        circular["self"] = circular;

        console.log("Circular object:", circular);

        const logs = dumpConsole();

        expect(logs).toHaveLength(1);
        expect(logs[0]?.message).toContain('"Circular object:"');
        // The exact string representation might vary, but it should be a string
        expect(typeof logs[0]?.message).toBe("string");
    });

    test("should capture messages in chronological order", () => {
        const dumpConsole = createConsoleDumper();

        console.log("First message");
        console.warn("Second message");
        console.error("Third message");

        const logs = dumpConsole();

        expect(logs).toHaveLength(3);
        expect(logs[0]?.message).toBe('"First message"');
        expect(logs[0]?.level).toBe("log");
        expect(logs[1]?.message).toBe('"Second message"');
        expect(logs[1]?.level).toBe("warn");
        expect(logs[2]?.message).toBe('"Third message"');
        expect(logs[2]?.level).toBe("error");
    });

    test("should return a shallow copy of logs", () => {
        const dumpConsole = createConsoleDumper();

        console.log("Test message");

        const firstDump = dumpConsole();
        const secondDump = dumpConsole();

        // Both dumps should have the same content
        expect(firstDump).toEqual(secondDump);

        // But they should be different objects (shallow copy)
        expect(firstDump).not.toBe(secondDump);
    });

    test("should continue capturing after dump", () => {
        const dumpConsole = createConsoleDumper();

        console.log("Before dump");
        const firstDump = dumpConsole();
        console.log("After dump");
        const secondDump = dumpConsole();

        expect(firstDump).toHaveLength(1);
        expect(firstDump[0]?.message).toBe('"Before dump"');

        expect(secondDump).toHaveLength(2);
        expect(secondDump[0]?.message).toBe('"Before dump"');
        expect(secondDump[1]?.message).toBe('"After dump"');
    });
});
