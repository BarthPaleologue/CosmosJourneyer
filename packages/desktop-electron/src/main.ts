import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type * as ElectronModule from "electron";

import { createDesktopAutoUpdateService, type DesktopAutoUpdateService } from "./autoUpdate.js";
import { createDevWatcher, type DevWatcher } from "./devWatcher.js";
import { createDevelopmentAutoUpdater } from "./mockAutoUpdater.js";
import { appHost, appScheme, createHandleAppProtocol } from "./protocol.js";
import { updateIpcChannels } from "./updateContract.js";

const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain, protocol, shell } = require("electron") as typeof ElectronModule;

const isDevelopment = process.env["COSMOS_DESKTOP_DEV"] === "1";

const currentDir = fileURLToPath(new URL(".", import.meta.url));
const packagedRendererDir = join(currentDir, "renderer");
const developmentRendererDir = resolve(currentDir, "..", "..", "game", "dist");
const rendererDir = isDevelopment ? developmentRendererDir : packagedRendererDir;

let autoUpdateService: DesktopAutoUpdateService | null = null;
let devWatcher: DevWatcher | null = null;

protocol.registerSchemesAsPrivileged([
    {
        scheme: appScheme,
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
        },
    },
]);

function createMainWindow(): ElectronModule.BrowserWindow {
    const window = new BrowserWindow({
        width: 1280,
        height: 720,
        autoHideMenuBar: true,
        backgroundColor: "#000000",
        fullscreen: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            preload: join(currentDir, "preload.cjs"),
        },
    });

    void window.loadURL(`${appScheme}://${appHost}/index.html`);
    devWatcher?.watch(window);

    return window;
}

void app.whenReady().then(() => {
    devWatcher = createDevWatcher(rendererDir);
    protocol.handle(appScheme, createHandleAppProtocol(rendererDir));
    registerAutoUpdateIpc();
    createMainWindow();
    const developmentUpdater = createDevelopmentAutoUpdater(app, isDevelopment);
    if (app.isPackaged || developmentUpdater !== null) {
        autoUpdateService = createDesktopAutoUpdateService(broadcastUpdateState, developmentUpdater ?? undefined);
        autoUpdateService.start();
    }

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

function broadcastUpdateState(state: ReturnType<DesktopAutoUpdateService["getState"]>): void {
    for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send(updateIpcChannels.stateChanged, state);
    }
}

app.on("before-quit", () => {
    devWatcher?.close();
    devWatcher = null;
});

function registerAutoUpdateIpc(): void {
    ipcMain.handle(updateIpcChannels.getState, () => autoUpdateService?.getState() ?? { type: "idle" });
    ipcMain.handle(updateIpcChannels.download, async () => autoUpdateService?.downloadUpdate());
    ipcMain.handle(updateIpcChannels.cancelDownload, async () => autoUpdateService?.cancelDownload());
    ipcMain.handle(updateIpcChannels.installOnQuit, () => autoUpdateService?.installOnQuit());
    ipcMain.handle(updateIpcChannels.installNow, () => autoUpdateService?.installNow());
    ipcMain.handle(updateIpcChannels.openReleasePage, async () => {
        const state = autoUpdateService?.getState() ?? { type: "idle" };
        if (state.type === "idle" || state.type === "installOnQuit") {
            return;
        }
        const releaseUrl = `https://github.com/BarthPaleologue/CosmosJourneyer/releases/tag/v${encodeURIComponent(state.version)}`;
        await shell.openExternal(releaseUrl);
    });
}

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
