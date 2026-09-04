import type { TFunction } from "i18next";

import type { ISoundPlayer } from "@/frontend/audio/soundPlayer";

import type { DesktopUpdateState } from "@/utils/desktopUpdateApi";

const changelogPlaceholder = "__COSMOS_CHANGELOG_LINK__";

export type CommanderBackupTarget = "current" | "latest" | null;

export type DesktopUpdateModalAction =
    | "backup"
    | "cancelDownload"
    | "download"
    | "installNow"
    | "installOnQuit"
    | "later"
    | "openReleasePage";

interface MenuButton {
    readonly action: DesktopUpdateModalAction;
    readonly labelKey: string;
}

export class DesktopUpdateModal {
    private readonly dialog: HTMLDialogElement;
    private readonly form: HTMLFormElement;
    private readonly soundPlayer: ISoundPlayer;
    private readonly t: TFunction;
    private readonly onAction: (action: DesktopUpdateModalAction) => void;
    private busy = false;

    public constructor(soundPlayer: ISoundPlayer, t: TFunction, onAction: (action: DesktopUpdateModalAction) => void) {
        this.soundPlayer = soundPlayer;
        this.t = t;
        this.onAction = onAction;
        this.dialog = document.createElement("dialog");
        this.dialog.classList.add("desktopUpdateModal");
        this.form = document.createElement("form");
        this.form.addEventListener("submit", (event) => {
            event.preventDefault();
        });
        this.dialog.addEventListener("cancel", (event) => {
            if (this.form.querySelector(".desktopUpdateProgressBar") !== null) {
                event.preventDefault();
            }
        });
        this.dialog.appendChild(this.form);
        document.body.appendChild(this.dialog);
    }

    public present(state: DesktopUpdateState, backupTarget: CommanderBackupTarget): void {
        if (this.dialog.open && state.type === "downloading" && this.updateDownloadProgress(state.percent)) {
            return;
        }
        this.render(state, backupTarget);
        if (!this.dialog.open) {
            this.dialog.showModal();
        }
    }

    public hide(): void {
        if (this.dialog.open) {
            this.dialog.close();
        }
        this.busy = false;
    }

    public setBusy(busy: boolean): void {
        this.busy = busy;
        this.form.querySelectorAll("button").forEach((button) => {
            button.disabled = busy;
        });
    }

    private render(state: DesktopUpdateState, backupTarget: CommanderBackupTarget): void {
        this.form.replaceChildren();

        switch (state.type) {
            case "idle":
                return;
            case "available":
                this.appendTitle("desktopUpdate:updateAvailableTitle", { version: state.version });
                this.appendUpdateDescription();
                this.appendAvailableMenu(backupTarget);
                return;
            case "downloading": {
                this.appendTitle("desktopUpdate:downloadingTitle", { version: state.version });
                const progressBar = document.createElement("div");
                progressBar.classList.add("progressBar", "desktopUpdateProgressBar");
                progressBar.setAttribute("role", "progressbar");
                progressBar.setAttribute("aria-valuemin", "0");
                progressBar.setAttribute("aria-valuemax", "100");
                this.form.appendChild(progressBar);
                const progressText = document.createElement("p");
                progressText.classList.add("desktopUpdateProgressText");
                this.form.appendChild(progressText);
                this.updateDownloadProgress(state.percent);
                this.appendMenu([{ action: "cancelDownload", labelKey: "common:cancel" }]);
                return;
            }
            case "downloaded":
                this.appendTitle("desktopUpdate:updateReadyTitle", { version: state.version });
                this.appendUpdateDescription();
                this.appendMenu([
                    { action: "later", labelKey: "desktopUpdate:later" },
                    { action: "installNow", labelKey: "desktopUpdate:installNow" },
                    { action: "installOnQuit", labelKey: "desktopUpdate:installOnQuit" },
                ]);
                return;
            case "installOnQuit":
                return;
            case "downloadError":
                this.appendTitle("desktopUpdate:downloadFailedTitle");
                this.appendText("desktopUpdate:installationUnchangedAfterDownloadFailure");
                this.appendText("desktopUpdate:downloadCanBeRetried");
                this.appendMenu([
                    { action: "later", labelKey: "desktopUpdate:later" },
                    { action: "download", labelKey: "desktopUpdate:retryDownload" },
                ]);
        }
    }

    private appendAvailableMenu(backupTarget: CommanderBackupTarget): void {
        const buttons: MenuButton[] = [{ action: "later", labelKey: "desktopUpdate:later" }];
        if (backupTarget !== null) {
            buttons.push({
                action: "backup",
                labelKey:
                    backupTarget === "latest"
                        ? "desktopUpdate:downloadLatestCommanderBackup"
                        : "desktopUpdate:downloadCurrentCommanderBackup",
            });
        }
        buttons.push({ action: "download", labelKey: "desktopUpdate:downloadUpdate" });
        this.appendMenu(buttons);
    }

    private appendTitle(key: string, options?: Record<string, string | number>): void {
        const title = document.createElement("h2");
        title.textContent = this.translate(key, options);
        this.form.appendChild(title);
    }

    private appendText(key: string): void {
        const text = document.createElement("p");
        text.textContent = this.translate(key);
        this.form.appendChild(text);
    }

    private appendUpdateDescription(): void {
        const text = document.createElement("p");
        const description = this.translate("desktopUpdate:updateDescription", {
            changelog: changelogPlaceholder,
        });
        const changelogIndex = description.indexOf(changelogPlaceholder);
        if (changelogIndex === -1) {
            this.appendTextWithLineBreaks(text, description);
            this.form.appendChild(text);
            return;
        }

        this.appendTextWithLineBreaks(text, description.slice(0, changelogIndex));

        const changelogLink = document.createElement("a");
        changelogLink.href = "#";
        changelogLink.textContent = this.translate("desktopUpdate:updateAvailableChangelogLink");
        changelogLink.addEventListener("click", (event) => {
            event.preventDefault();
            this.soundPlayer.playNow("click");
            this.onAction("openReleasePage");
        });
        text.appendChild(changelogLink);

        this.appendTextWithLineBreaks(text, description.slice(changelogIndex + changelogPlaceholder.length));
        this.form.appendChild(text);
    }

    private appendTextWithLineBreaks(container: HTMLElement, text: string): void {
        const lines = text.split("\n");
        lines.forEach((line, index) => {
            if (index > 0) {
                container.appendChild(document.createElement("br"));
            }
            container.append(line);
        });
    }

    private updateDownloadProgress(downloadPercent: number): boolean {
        const progressBar = this.form.querySelector<HTMLElement>(".desktopUpdateProgressBar");
        const progressText = this.form.querySelector<HTMLElement>(".desktopUpdateProgressText");
        if (progressBar === null || progressText === null) {
            return false;
        }

        const percent = Math.max(0, Math.min(100, downloadPercent));
        progressBar.style.setProperty("--progress", `${percent}%`);
        progressBar.setAttribute("aria-valuenow", String(Math.round(percent)));
        progressText.textContent = this.translate("desktopUpdate:downloadProgress", {
            percent: Math.round(percent),
        });
        return true;
    }

    private appendMenu(buttons: ReadonlyArray<MenuButton>): void {
        const menu = document.createElement("menu");
        for (const { action, labelKey } of buttons) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = this.translate(labelKey);
            button.disabled = this.busy;
            if (action === "backup") {
                button.title = this.translate("desktopUpdate:backupExplanation");
            }
            button.addEventListener("click", () => {
                this.soundPlayer.playNow("click");
                this.onAction(action);
            });
            menu.appendChild(button);
        }
        this.form.appendChild(menu);
    }
    private translate(key: string, options?: Record<string, string | number>): string {
        return options === undefined ? this.t(key) : this.t(key, options);
    }
}
