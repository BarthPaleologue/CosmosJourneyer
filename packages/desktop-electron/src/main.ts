import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type * as ElectronModule from "electron";

import { startAutoUpdatePolling } from "./autoUpdate.js";
import { createDevWatcher, type DevWatcher } from "./devWatcher.js";
import { appHost, appScheme, createHandleAppProtocol } from "./protocol.js";

const require = createRequire(import.meta.url);
const { app, BrowserWindow, protocol } = require("electron") as typeof ElectronModule;

const isDevelopment = process.env["COSMOS_DESKTOP_DEV"] === "1";

const currentDir = fileURLToPath(new URL(".", import.meta.url));
const packagedRendererDir = join(currentDir, "renderer");
const developmentRendererDir = resolve(currentDir, "..", "..", "game", "dist");
const rendererDir = isDevelopment ? developmentRendererDir : packagedRendererDir;

let stopAutoUpdatePolling: (() => void) | null = null;
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
        },
    });

    void window.loadURL(`${appScheme}://${appHost}/index.html`);
    devWatcher?.watch(window);

    return window;
}

void app.whenReady().then(async () => {
    devWatcher = createDevWatcher(rendererDir);
    protocol.handle(appScheme, createHandleAppProtocol(rendererDir));
    createMainWindow();
    if (app.isPackaged) {
        stopAutoUpdatePolling = await startAutoUpdatePolling();
    }

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on("before-quit", () => {
    stopAutoUpdatePolling?.();
    stopAutoUpdatePolling = null;
    devWatcher?.close();
    devWatcher = null;
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
