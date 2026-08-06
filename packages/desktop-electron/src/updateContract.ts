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

export const updateIpcChannels = {
    getState: "desktop-update:get-state",
    stateChanged: "desktop-update:state-changed",
    download: "desktop-update:download",
    cancelDownload: "desktop-update:cancel-download",
    installOnQuit: "desktop-update:install-on-quit",
    installNow: "desktop-update:install-now",
    openReleasePage: "desktop-update:open-release-page",
} as const;
