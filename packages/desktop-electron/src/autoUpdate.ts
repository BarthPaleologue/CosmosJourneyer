import { autoUpdater, CancellationToken, type ProgressInfo, type UpdateInfo } from "electron-updater";

import { type DesktopUpdateState } from "./updateContract.js";

const updateCheckIntervalMs = 4 * 60 * 60 * 1_000;

export interface AutoUpdaterClient {
    autoDownload: boolean;
    autoInstallOnAppQuit: boolean;
    checkForUpdates(): Promise<unknown>;
    downloadUpdate(cancellationToken?: CancellationToken): Promise<Array<string>>;
    quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean): void;
    on(event: "update-available", listener: (info: UpdateInfo) => void): void;
    on(event: "download-progress", listener: (progress: ProgressInfo) => void): void;
    on(event: "error", listener: (error: Error) => void): void;
}

export class DesktopAutoUpdateService {
    private readonly updater: AutoUpdaterClient;
    private readonly onStateChanged: (state: DesktopUpdateState) => void;
    private state: DesktopUpdateState = { type: "idle" };
    private checkInProgress = false;
    private downloadCancellationToken: CancellationToken | null = null;
    private downloadPromise: Promise<void> | null = null;

    public constructor(updater: AutoUpdaterClient, onStateChanged: (state: DesktopUpdateState) => void) {
        this.updater = updater;
        this.onStateChanged = onStateChanged;
        this.updater.autoDownload = false;
        this.updater.autoInstallOnAppQuit = false;
    }

    public start(): void {
        this.updater.on("update-available", this.handleUpdateAvailable);
        this.updater.on("download-progress", this.handleDownloadProgress);
        this.updater.on("error", this.handleError);

        void this.checkForUpdate();
        const interval = setInterval(() => {
            void this.checkForUpdate();
        }, updateCheckIntervalMs);
        interval.unref();
    }

    public getState(): DesktopUpdateState {
        return this.state;
    }

    public async downloadUpdate(): Promise<void> {
        if (this.state.type !== "available" && this.state.type !== "downloadError") {
            return Promise.resolve();
        }

        const version = this.state.version;
        const downloadPromise = this.runDownload(version);
        this.downloadPromise = downloadPromise;
        void downloadPromise.finally(() => {
            this.downloadPromise = null;
        });
        return downloadPromise;
    }

    public async cancelDownload(): Promise<void> {
        this.downloadCancellationToken?.cancel();
        await this.downloadPromise;
    }

    private async runDownload(version: string): Promise<void> {
        const cancellationToken = new CancellationToken();
        this.downloadCancellationToken = cancellationToken;
        this.setState({
            type: "downloading",
            version,
            percent: 0,
        });
        try {
            await this.updater.downloadUpdate(cancellationToken);
            this.setState({ type: "downloaded", version });
        } catch (error) {
            if (cancellationToken.cancelled) {
                this.setState({ type: "available", version });
            } else if (this.state.type === "downloading") {
                this.setDownloadError(error, version);
            }
        } finally {
            cancellationToken.dispose();
            this.downloadCancellationToken = null;
        }
    }

    public installOnQuit(): void {
        if (this.state.type !== "downloaded") {
            return;
        }
        this.updater.autoInstallOnAppQuit = true;
        this.setState({ type: "installOnQuit" });
    }

    public installNow(): void {
        if (this.state.type !== "downloaded") {
            return;
        }
        this.updater.quitAndInstall(false, true);
    }

    private readonly checkForUpdate = async (): Promise<void> => {
        if (this.checkInProgress || this.state.type !== "idle") {
            return;
        }

        this.checkInProgress = true;
        try {
            await this.updater.checkForUpdates();
        } catch (error) {
            console.error("Failed to check for a desktop application update.", error);
        } finally {
            this.checkInProgress = false;
        }
    };

    private readonly handleUpdateAvailable = (info: UpdateInfo): void => {
        this.setState({
            type: "available",
            version: info.version,
        });
    };

    private readonly handleDownloadProgress = (progress: ProgressInfo): void => {
        if (this.state.type !== "downloading") {
            return;
        }
        this.setState({
            type: "downloading",
            version: this.state.version,
            percent: progress.percent,
        });
    };

    private readonly handleError = (error: Error): void => {
        if (this.state.type === "downloading") {
            this.setDownloadError(error, this.state.version);
            return;
        }
        console.error("Desktop application updater failed.", error);
    };

    private setDownloadError(error: unknown, version: string): void {
        console.error("Failed to download a desktop application update.", error);
        this.setState({
            type: "downloadError",
            version,
        });
    }

    private setState(state: DesktopUpdateState): void {
        this.state = state;
        this.onStateChanged(state);
    }
}

export function createDesktopAutoUpdateService(
    onStateChanged: (state: DesktopUpdateState) => void,
    updater?: AutoUpdaterClient,
): DesktopAutoUpdateService {
    return new DesktopAutoUpdateService(updater ?? autoUpdater, onStateChanged);
}
