export type DesktopUpdateState =
    | { readonly type: "idle" }
    | { readonly type: "available"; readonly version: string }
    | {
          readonly type: "downloading";
          readonly version: string;
          readonly percent: number;
      }
    | { readonly type: "downloaded"; readonly version: string }
    | { readonly type: "installOnQuit" }
    | { readonly type: "downloadError"; readonly version: string };

export interface DesktopUpdateApi {
    getState(): Promise<DesktopUpdateState>;
    download(): Promise<void>;
    cancelDownload(): Promise<void>;
    installOnQuit(): Promise<void>;
    installNow(): Promise<void>;
    openReleasePage(): Promise<void>;
    onStateChanged(listener: (state: DesktopUpdateState) => void): void;
}

declare global {
    interface Window {
        readonly cosmosDesktop?: {
            readonly updates: DesktopUpdateApi;
        };
    }
}

/**
 * Reads the desktop bridge's update API when the game runs inside the desktop app.
 * @returns Update controls exposed by Electron, or `null` in a browser without the bridge.
 */
export function getDesktopUpdateApi(): DesktopUpdateApi | null {
    return window.cosmosDesktop?.updates ?? null;
}
