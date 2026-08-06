import { type ISoundPlayer } from "@/frontend/audio/soundPlayer";

import { type DesktopUpdateApi, type DesktopUpdateState } from "@/utils/desktopUpdateApi";

import i18n from "@/i18n";

import {
    type CommanderBackupTarget,
    DesktopUpdateModal,
    type DesktopUpdateModalAction,
} from "./dialogModal/desktopUpdateModal";
import { type INotificationManager } from "./notificationManager";

export type UpdatePresentationContext = "gameplay" | "mainMenu" | "pauseMenu";

export interface DesktopUpdatePlayerActions {
    getPresentationContext(): UpdatePresentationContext;
    canBackupCurrentCommander(): boolean;
    downloadCommanderBackup(context: Exclude<UpdatePresentationContext, "gameplay">): Promise<boolean>;
    prepareImmediateInstall(): Promise<boolean>;
}

export class DesktopUpdateController {
    private readonly api: DesktopUpdateApi;
    private readonly playerActions: DesktopUpdatePlayerActions;
    private readonly notificationManager: INotificationManager;
    private readonly modal: DesktopUpdateModal;
    private state: DesktopUpdateState = { type: "idle" };
    private dismissed = false;

    public constructor(
        api: DesktopUpdateApi,
        playerActions: DesktopUpdatePlayerActions,
        notificationManager: INotificationManager,
        soundPlayer: ISoundPlayer,
    ) {
        this.api = api;
        this.playerActions = playerActions;
        this.notificationManager = notificationManager;
        this.modal = new DesktopUpdateModal(soundPlayer, (action) => {
            void this.handleAction(action);
        });
    }

    public async start(): Promise<void> {
        let stateEventGeneration = 0;
        this.api.onStateChanged((state) => {
            stateEventGeneration += 1;
            this.handleStateChanged(state);
        });
        const generationBeforeRead = stateEventGeneration;
        const initialState = await this.api.getState();
        if (stateEventGeneration === generationBeforeRead) {
            this.handleStateChanged(initialState);
        }
    }

    public refreshPresentation(): void {
        if (this.state.type === "idle" || this.state.type === "installOnQuit") {
            this.modal.hide();
            return;
        }
        const context = this.playerActions.getPresentationContext();
        if (context === "gameplay") {
            if (this.state.type === "downloading") {
                this.modal.present(this.state, null);
                return;
            }
            this.modal.hide();
            return;
        }
        if (this.dismissed && this.state.type !== "downloading") {
            return;
        }
        this.modal.present(this.state, this.getBackupTarget(context));
    }

    private handleStateChanged(state: DesktopUpdateState): void {
        this.state = state;
        this.refreshPresentation();
    }

    private getBackupTarget(context: Exclude<UpdatePresentationContext, "gameplay">): CommanderBackupTarget {
        if (context === "mainMenu") {
            return "latest";
        }
        return this.playerActions.canBackupCurrentCommander() ? "current" : null;
    }

    private async handleAction(action: DesktopUpdateModalAction): Promise<void> {
        switch (action) {
            case "cancelDownload":
                this.modal.setBusy(true);
                await this.api.cancelDownload();
                this.modal.setBusy(false);
                return;
            case "later":
                this.dismissed = true;
                this.modal.hide();
                return;
            case "openReleasePage":
                await this.api.openReleasePage();
                return;
            case "download":
                await this.api.download();
                return;
            case "installOnQuit":
                this.modal.setBusy(true);
                await this.api.installOnQuit();
                this.modal.setBusy(false);
                return;
            case "installNow": {
                this.modal.setBusy(true);
                const isReadyToInstall = await this.playerActions.prepareImmediateInstall();
                if (!isReadyToInstall) {
                    this.notificationManager.create(
                        "general",
                        "error",
                        i18n.t("desktopUpdate:installBlockedBySafetySaveFailure"),
                        5000,
                    );
                    this.modal.setBusy(false);
                    return;
                }
                await this.api.installNow();
                this.modal.setBusy(false);
                return;
            }
            case "backup": {
                const context = this.playerActions.getPresentationContext();
                if (context === "gameplay") {
                    return;
                }
                this.modal.setBusy(true);
                const backupStarted = await this.playerActions.downloadCommanderBackup(context);
                if (!backupStarted) {
                    this.notificationManager.create("general", "error", i18n.t("desktopUpdate:backupFailed"), 5000);
                }
                this.modal.setBusy(false);
                return;
            }
        }
    }
}
