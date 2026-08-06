// Sandboxed Electron preload scripts use CommonJS even though the main process uses ESM.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextBridge, ipcRenderer } = require("electron") as typeof import("electron");

type DesktopUpdateState = import("./updateContract.js").DesktopUpdateState;

const updateIpcChannels = {
    getState: "desktop-update:get-state",
    stateChanged: "desktop-update:state-changed",
    download: "desktop-update:download",
    cancelDownload: "desktop-update:cancel-download",
    installOnQuit: "desktop-update:install-on-quit",
    installNow: "desktop-update:install-now",
    openReleasePage: "desktop-update:open-release-page",
} as const;

const desktopApi = {
    updates: {
        getState: (): Promise<DesktopUpdateState> => ipcRenderer.invoke(updateIpcChannels.getState),
        download: (): Promise<void> => ipcRenderer.invoke(updateIpcChannels.download),
        cancelDownload: (): Promise<void> => ipcRenderer.invoke(updateIpcChannels.cancelDownload),
        installOnQuit: (): Promise<void> => ipcRenderer.invoke(updateIpcChannels.installOnQuit),
        installNow: (): Promise<void> => ipcRenderer.invoke(updateIpcChannels.installNow),
        openReleasePage: (): Promise<void> => ipcRenderer.invoke(updateIpcChannels.openReleasePage),
        onStateChanged: (listener: (state: DesktopUpdateState) => void): void => {
            ipcRenderer.on(
                updateIpcChannels.stateChanged,
                (_event: Electron.IpcRendererEvent, state: DesktopUpdateState) => {
                    listener(state);
                },
            );
        },
    },
};

contextBridge.exposeInMainWorld("cosmosDesktop", desktopApi);
