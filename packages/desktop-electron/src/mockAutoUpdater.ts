import { EventEmitter } from "node:events";

import type { App } from "electron";
import type { CancellationToken, ProgressInfo, UpdateInfo } from "electron-updater";

import type { AutoUpdaterClient } from "./autoUpdate.js";

const mockDownloadStepIntervalMs = 250;
const mockDownloadStepCount = 20;
const mockDownloadSizeBytes = 125_000_000;

export function createDevelopmentAutoUpdater(
    app: Pick<App, "getVersion" | "isPackaged" | "quit">,
    isDevelopment: boolean,
): MockAutoUpdaterClient | null {
    if (app.isPackaged || !isDevelopment || process.env["COSMOS_DESKTOP_MOCK_UPDATE"] !== "1") {
        return null;
    }

    const detectionDelayMs = Number(process.env["COSMOS_DESKTOP_MOCK_UPDATE_DELAY_MS"] ?? 1_000);
    console.info(`Mock update enabled: simulating version ${app.getVersion()} after ${detectionDelayMs} ms.`);
    return new MockAutoUpdaterClient(
        app.getVersion(),
        () => {
            console.info("Mock update: immediate installation requested. Closing the application.");
            app.quit();
        },
        detectionDelayMs,
    );
}

export class MockAutoUpdaterClient extends EventEmitter implements AutoUpdaterClient {
    public autoDownload = false;
    public autoInstallOnAppQuit = false;

    private readonly updateInfo: UpdateInfo;
    private readonly onInstallNow: () => void;
    private readonly detectionDelayMs: number;

    public constructor(version: string, onInstallNow: () => void, detectionDelayMs: number) {
        super();
        this.onInstallNow = onInstallNow;
        this.detectionDelayMs = detectionDelayMs;
        this.updateInfo = {
            version,
            files: [],
            path: "mock-update",
            sha512: "mock-update",
            releaseDate: new Date().toISOString(),
        };
    }

    public async checkForUpdates(): Promise<null> {
        await wait(this.detectionDelayMs);
        this.emit("update-available", this.updateInfo);
        return null;
    }

    public async downloadUpdate(cancellationToken?: CancellationToken): Promise<Array<string>> {
        for (let step = 1; step <= mockDownloadStepCount; step += 1) {
            await wait(mockDownloadStepIntervalMs);
            if (cancellationToken?.cancelled === true) {
                throw new Error("Mock update download cancelled.");
            }
            const transferred = Math.round((step / mockDownloadStepCount) * mockDownloadSizeBytes);
            const progress: ProgressInfo = {
                percent: (step / mockDownloadStepCount) * 100,
                bytesPerSecond: (mockDownloadSizeBytes * 1_000) / (mockDownloadStepIntervalMs * mockDownloadStepCount),
                transferred,
                total: mockDownloadSizeBytes,
                delta: mockDownloadSizeBytes / mockDownloadStepCount,
            };
            this.emit("download-progress", progress);
        }

        return ["mock-update"];
    }

    public quitAndInstall(): void {
        this.onInstallNow();
    }
}

async function wait(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, durationMs);
    });
}
