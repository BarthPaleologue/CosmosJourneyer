import { afterEach, describe, expect, it, vi } from "vitest";

import { MockAutoUpdaterClient } from "./mockAutoUpdater.js";

describe("MockAutoUpdaterClient", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("simulates detection, progress, download completion, and installation", async () => {
        vi.useFakeTimers();
        const onInstallNow = vi.fn();
        const updater = new MockAutoUpdaterClient("1.12.0-mock", onInstallNow, 1_000);
        const onAvailable = vi.fn();
        const onProgress = vi.fn();
        updater.on("update-available", onAvailable);
        updater.on("download-progress", onProgress);

        const checkPromise = updater.checkForUpdates();
        await vi.advanceTimersByTimeAsync(1_000);
        await checkPromise;
        expect(onAvailable).toHaveBeenCalledWith(expect.objectContaining({ version: "1.12.0-mock" }));

        const downloadPromise = updater.downloadUpdate();
        await vi.advanceTimersByTimeAsync(5_000);
        await expect(downloadPromise).resolves.toEqual(["mock-update"]);
        expect(onProgress).toHaveBeenLastCalledWith(
            expect.objectContaining({ percent: 100, transferred: 125_000_000, total: 125_000_000 }),
        );

        updater.quitAndInstall();
        expect(onInstallNow).toHaveBeenCalledOnce();
    });
});
