import { watch, type FSWatcher } from "node:fs";

import type * as ElectronModule from "electron";

import { waitForRendererBuild } from "./protocol.js";

const debounceMs = 250;

export interface DevWatcher {
    watch(window: ElectronModule.BrowserWindow): void;
    close(): void;
}

async function reloadWhenReady(rendererDir: string, window: ElectronModule.BrowserWindow): Promise<void> {
    const isReady = await waitForRendererBuild(rendererDir);
    if (!isReady || window.isDestroyed()) {
        return;
    }

    window.webContents.reload();
}

export function createDevWatcher(rendererDir: string): DevWatcher {
    let fsWatcher: FSWatcher | null = null;
    let reloadTimer: NodeJS.Timeout | null = null;

    return {
        watch(window) {
            if (process.env["COSMOS_DESKTOP_DEV"] !== "1") {
                return;
            }

            fsWatcher?.close();
            fsWatcher = watch(rendererDir, { persistent: false }, () => {
                if (window.isDestroyed()) {
                    return;
                }

                if (reloadTimer !== null) {
                    clearTimeout(reloadTimer);
                }

                reloadTimer = setTimeout(() => {
                    void reloadWhenReady(rendererDir, window);
                }, debounceMs);
            });
        },

        close() {
            fsWatcher?.close();
            fsWatcher = null;
            if (reloadTimer !== null) {
                clearTimeout(reloadTimer);
                reloadTimer = null;
            }
        },
    };
}
