import { EventEmitter } from "node:events";

import type { ProgressInfo, UpdateInfo } from "electron-updater";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DesktopAutoUpdateService } from "./autoUpdate.js";
import type { AutoUpdaterClient } from "./autoUpdate.js";
import type { DesktopUpdateState } from "./updateContract.js";

/** @returns An updater double with real event delivery and stubbed network operations. */
function createUpdater() {
    return Object.assign(new EventEmitter(), {
        autoDownload: true,
        autoInstallOnAppQuit: true,
        isUpdateSupported: vi.fn<AutoUpdaterClient["isUpdateSupported"]>().mockReturnValue(true),
        checkForUpdates: vi.fn<AutoUpdaterClient["checkForUpdates"]>().mockResolvedValue(null),
        downloadUpdate: vi.fn<AutoUpdaterClient["downloadUpdate"]>().mockResolvedValue(["update"]),
        quitAndInstall: vi.fn<AutoUpdaterClient["quitAndInstall"]>(),
    });
}

describe("DesktopAutoUpdateService", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("installs the minimum release age check on the updater", async () => {
        const updater = createUpdater();
        const now = Date.parse("2026-11-07T12:00:00.000Z");
        vi.spyOn(Date, "now").mockReturnValue(now);
        const release = {
            published_at: new Date(now - 60 * 60 * 1_000).toISOString(),
            draft: false,
        };
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(release))));

        new DesktopAutoUpdateService(updater, () => {});
        expect(await updater.isUpdateSupported(createUpdateInfo())).toBe(false);
    });

    it("waits for explicit consent before downloading and installing", async () => {
        const updater = createUpdater();
        const states: Array<DesktopUpdateState> = [];
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
        const updater = createUpdater();
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
        const updater = createUpdater();
        updater.downloadUpdate.mockImplementationOnce(
            async (token) =>
                new Promise((_resolve, reject) => {
                    token.once("cancel", () => {
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

/**
 * Creates release metadata for the desktop updater tests.
 * @returns The release metadata fixture.
 */
function createUpdateInfo(): UpdateInfo {
    return {
        version: "1.12.0",
        files: [],
        path: "",
        sha512: "",
        releaseDate: "2026-07-28",
    };
}
