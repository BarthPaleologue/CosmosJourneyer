import { EventEmitter } from "node:events";

import type { CancellationToken, ProgressInfo, UpdateInfo } from "electron-updater";
import { describe, expect, it, vi } from "vitest";

import { DesktopAutoUpdateService } from "./autoUpdate.js";
import { type DesktopUpdateState } from "./updateContract.js";

class MockUpdater extends EventEmitter {
    public autoDownload = true;
    public autoInstallOnAppQuit = true;
    public readonly checkForUpdates = vi.fn<() => Promise<null>>(() => Promise.resolve(null));
    public readonly downloadUpdate = vi.fn<(token?: CancellationToken) => Promise<Array<string>>>(() =>
        Promise.resolve(["update"]),
    );
    public readonly quitAndInstall = vi.fn();
}

describe("DesktopAutoUpdateService", () => {
    it("waits for explicit consent before downloading and installing", async () => {
        const updater = new MockUpdater();
        const states: DesktopUpdateState[] = [];
        const service = new DesktopAutoUpdateService(updater, (state) => states.push(state));

        expect(updater.autoDownload).toBe(false);
        expect(updater.autoInstallOnAppQuit).toBe(false);

        service.start();
        updater.emit("update-available", createUpdateInfo());
        expect(service.getState()).toMatchObject({ type: "available", version: "1.12.0" });
        expect(updater.downloadUpdate).not.toHaveBeenCalled();

        await service.downloadUpdate();
        expect(updater.downloadUpdate).toHaveBeenCalledOnce();
        expect(service.getState()).toMatchObject({ type: "downloaded", version: "1.12.0" });

        service.installOnQuit();
        expect(updater.autoInstallOnAppQuit).toBe(true);
        expect(states.at(-1)).toEqual({ type: "installOnQuit" });
        service.installNow();
        expect(updater.quitAndInstall).not.toHaveBeenCalled();
    });

    it("publishes download progress", async () => {
        const updater = new MockUpdater();
        const service = new DesktopAutoUpdateService(updater, () => {});
        service.start();
        updater.emit("update-available", createUpdateInfo());
        const downloadPromise = service.downloadUpdate();

        const progress: ProgressInfo = {
            percent: 42,
            bytesPerSecond: 1_000,
            transferred: 42_000,
            total: 100_000,
            delta: 1_000,
        };
        updater.emit("download-progress", progress);

        expect(service.getState()).toEqual({
            type: "downloading",
            version: "1.12.0",
            percent: 42,
        });
        await downloadPromise;
    });

    it("returns to the available state when the player cancels a download", async () => {
        const updater = new MockUpdater();
        updater.downloadUpdate.mockImplementationOnce(
            (token) =>
                new Promise((_resolve, reject) => {
                    token?.once("cancel", () => {
                        reject(new Error("Cancelled"));
                    });
                }),
        );
        const service = new DesktopAutoUpdateService(updater, () => {});
        service.start();
        updater.emit("update-available", createUpdateInfo());

        const downloadPromise = service.downloadUpdate();
        expect(service.getState().type).toBe("downloading");
        await service.cancelDownload();
        await downloadPromise;

        expect(service.getState()).toEqual({ type: "available", version: "1.12.0" });
    });
});

function createUpdateInfo(): UpdateInfo {
    return {
        version: "1.12.0",
        files: [],
        path: "",
        sha512: "",
        releaseDate: "2026-07-28",
    };
}
