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

// Define the shape of each log entry
interface LogEntry {
    level: ConsoleMethod;
    timestamp: string;
    message: string;
}

// Restrict console methods to these five
type ConsoleMethod = "log" | "info" | "warn" | "error" | "debug";

export function createConsoleDumper(): () => LogEntry[] {
    // Internal buffer to hold captured console entries
    const logs: Array<LogEntry> = [];

    // List of console methods we want to override
    const methods: Array<ConsoleMethod> = ["log", "info", "warn", "error", "debug"];

    // Keep originals so we can still print to the real console
    const originals: Partial<Record<ConsoleMethod, (...args: unknown[]) => void>> = {};

    methods.forEach((method) => {
        const originalFn = console[method];
        if (typeof originalFn === "function") {
            // Store the original implementation
            originals[method] = originalFn.bind(console);

            // Override console[method]
            console[method] = (...args: unknown[]): void => {
                // 1. Capture a simplified, JSON-friendly message string
                const message = args
                    .map((arg) => {
                        try {
                            return JSON.stringify(arg);
                        } catch {
                            // Fallback to String(...) if JSON.stringify fails (e.g. circular)
                            return String(arg);
                        }
                    })
                    .join(" ");

                // 2. Push an entry into our buffer
                logs.push({
                    level: method,
                    timestamp: new Date().toISOString(),
                    message,
                });

                // 3. Forward to the real console method
                originals[method]?.(...args);
            };
        }
    });

    // Return a “dump” function that the caller can invoke on demand
    return function dumpConsole(): LogEntry[] {
        // Return a shallow copy so the caller can serialize / inspect without mutating our buffer
        return logs.slice();
    };
}
