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

export function getDesktopUpdateApi(): DesktopUpdateApi | null {
    return window.cosmosDesktop?.updates ?? null;
}
