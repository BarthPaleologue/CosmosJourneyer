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

const ConsoleMethods = ["log", "info", "warn", "error", "debug"] as const;
type ConsoleMethod = (typeof ConsoleMethods)[number];

export interface LogEntry {
    level: ConsoleMethod;
    timestamp: string;
    message: string;
}

export class ConsoleDumper {
    private readonly logs: Array<LogEntry> = [];

    constructor() {
        for (const method of ConsoleMethods) {
            const originalConsoleMethod = console[method];
            if (typeof originalConsoleMethod !== "function") {
                continue;
            }

            const originalFn = originalConsoleMethod.bind(console);
            console[method] = (...args: unknown[]): void => {
                const message = args
                    .map((arg) => {
                        if (arg instanceof Error) {
                            return arg.stack ?? `${arg.name}: ${arg.message}`;
                        }

                        try {
                            const jsonString = JSON.stringify(arg) as string | undefined;
                            return jsonString === undefined ? String(arg) : jsonString;
                        } catch {
                            return String(arg);
                        }
                    })
                    .join(" ");

                this.logs.push({
                    level: method,
                    timestamp: new Date().toISOString(),
                    message,
                });

                originalFn(...args);
            };
        }
    }

    dump(): Array<LogEntry> {
        return [...this.logs];
    }
}
