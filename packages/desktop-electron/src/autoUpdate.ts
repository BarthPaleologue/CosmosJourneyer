import { type AppUpdater } from "electron-updater";

const updateCheckIntervalMs = 4 * 60 * 60 * 1_000;

async function getAutoUpdater(): Promise<AppUpdater> {
    const electronUpdater = (await import("electron-updater")).default;
    return electronUpdater.autoUpdater;
}

export async function startAutoUpdatePolling(updater?: AppUpdater): Promise<() => void> {
    const effectiveUpdater = updater ?? (await getAutoUpdater());
    let checkInProgress = false;

    const checkForUpdate = async (): Promise<void> => {
        if (checkInProgress) {
            return;
        }

        checkInProgress = true;
        try {
            await effectiveUpdater.checkForUpdatesAndNotify();
        } catch (error) {
            console.error("Failed to check for a desktop application update.", error);
        } finally {
            checkInProgress = false;
        }
    };

    void checkForUpdate();
    const interval = setInterval(() => {
        void checkForUpdate();
    }, updateCheckIntervalMs);
    interval.unref();

    return () => {
        clearInterval(interval);
    };
}
