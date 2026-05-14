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

import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { alertModal } from "@/frontend/ui/dialogModal/alertModal";

import packageJson from "../../../../../package.json";
import type { ConsoleDumper, LogEntry } from "./consoleDumper";
import { downloadTextFile } from "./download";

type CrashReport = {
    version: string;
    timestamp: string;
    source: CrashSourceType;
    error: SerializedError;
    logs: Array<LogEntry>;
};

type CrashSourceType = "startup" | "window-error" | "unhandled-rejection";

type SerializedError = {
    name?: string;
    message: string;
    stack?: string;
    cause?: SerializedError | string;
    filename?: string;
    lineno?: number;
    colno?: number;
};

type CrashSource =
    | {
          type: "startup";
          value: unknown;
      }
    | {
          type: "error";
          value: ErrorEvent;
      }
    | {
          type: "unhandledrejection";
          value: PromiseRejectionEvent;
      };

export class CrashReporter {
    private readonly consoleDumper: ConsoleDumper;
    private hasReportedCrash = false;

    private readonly handleError = (event: ErrorEvent) => {
        void this.reportCrash({ type: "error", value: event }).catch(console.error);
    };

    private readonly handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        void this.reportCrash({ type: "unhandledrejection", value: event }).catch(console.error);
    };

    constructor(consoleDumper: ConsoleDumper) {
        this.consoleDumper = consoleDumper;

        window.addEventListener("error", this.handleError);
        window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
    }

    dispose() {
        window.removeEventListener("error", this.handleError);
        window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
    }

    async reportCrash(crashSource: CrashSource) {
        if (this.hasReportedCrash) {
            return;
        }

        this.hasReportedCrash = true;
        const logs = this.consoleDumper.dump();
        const serializedCrashSource = this.serializeCrashSource(crashSource);

        const report: CrashReport = {
            version: packageJson.version,
            timestamp: new Date().toISOString(),
            source: serializedCrashSource.source,
            error: serializedCrashSource.error,
            logs,
        };

        await this.downloadReport(report);
    }

    private serializeCrashSource(crashSource: CrashSource): Pick<CrashReport, "source" | "error"> {
        switch (crashSource.type) {
            case "startup":
                return {
                    source: "startup",
                    error: serializeUnknownError(crashSource.value),
                };
            case "error": {
                const event = crashSource.value;
                const eventError = event.error as unknown;
                return {
                    source: "window-error",
                    error: {
                        ...serializeUnknownError(eventError),
                        message: event.message,
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                    },
                };
            }
            case "unhandledrejection": {
                const reason = crashSource.value.reason as unknown;
                return {
                    source: "unhandled-rejection",
                    error: serializeUnknownError(reason),
                };
            }
        }
    }

    private async downloadReport(report: CrashReport) {
        const reportString = JSON.stringify(report, null, 2);
        downloadTextFile(reportString, "crashLog.txt");
        await alertModal(
            `An unexpected error has occurred!<br><br>
        The crash log has been downloaded to your computer, please go to <a href="https://github.com/BarthPaleologue/CosmosJourneyer/issues">the issue tracker</a> and open a new bug issue with the crash log attached.
        If you don't have a GitHub account, you can send an email to barth.paleologue@cosmosjourneyer.com instead.`,
            new SoundPlayerMock(),
        );
    }
}

function serializeUnknownError(value: unknown): SerializedError {
    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            ...(value.stack === undefined ? {} : { stack: value.stack }),
            ...(value.cause === undefined ? {} : { cause: serializeCause(value.cause) }),
        };
    }

    if (typeof value === "string") {
        return { message: value };
    }

    return { message: stringifyUnknown(value) };
}

function serializeCause(value: unknown): SerializedError | string {
    if (value instanceof Error) {
        return serializeUnknownError(value);
    }

    return stringifyUnknown(value);
}

function stringifyUnknown(value: unknown): string {
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}
