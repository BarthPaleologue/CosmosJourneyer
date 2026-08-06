// @vitest-environment jsdom

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";

import { type DesktopUpdateApi, type DesktopUpdateState } from "@/utils/desktopUpdateApi";

import i18n, { initI18n } from "@/i18n";

import {
    DesktopUpdateController,
    type DesktopUpdatePlayerActions,
    type UpdatePresentationContext,
} from "./desktopUpdateController";
import { NotificationManagerMock } from "./notificationManager";

class DesktopUpdateApiMock implements DesktopUpdateApi {
    private listener: ((state: DesktopUpdateState) => void) | null = null;
    private state: DesktopUpdateState;

    public readonly download = vi.fn<() => Promise<void>>(() => Promise.resolve());
    public readonly cancelDownload = vi.fn<() => Promise<void>>(() => Promise.resolve());
    public readonly installOnQuit = vi.fn<() => Promise<void>>(() => Promise.resolve());
    public readonly installNow = vi.fn<() => Promise<void>>(() => Promise.resolve());
    public readonly openReleasePage = vi.fn<() => Promise<void>>(() => Promise.resolve());

    public constructor(state: DesktopUpdateState) {
        this.state = state;
    }

    public async getState(): Promise<DesktopUpdateState> {
        return Promise.resolve(this.state);
    }

    public onStateChanged(listener: (state: DesktopUpdateState) => void): void {
        this.listener = listener;
    }

    public emit(state: DesktopUpdateState): void {
        this.state = state;
        this.listener?.(state);
    }
}

describe("DesktopUpdateController", () => {
    beforeAll(async () => {
        await initI18n();
    });

    beforeEach(() => {
        HTMLDialogElement.prototype.showModal = function showModal(): void {
            this.setAttribute("open", "");
        };
        HTMLDialogElement.prototype.close = function close(): void {
            this.removeAttribute("open");
        };
    });

    afterEach(() => {
        document.body.replaceChildren();
    });

    it("does not open an empty modal while no update is available", async () => {
        const controller = new DesktopUpdateController(
            new DesktopUpdateApiMock({ type: "idle" }),
            createPlayerActions(() => "pauseMenu"),
            new NotificationManagerMock(),
            new SoundPlayerMock(),
        );

        await controller.start();
        controller.refreshPresentation();

        expect(document.querySelector("dialog")?.hasAttribute("open")).toBe(false);
    });

    it("defers an available update until the player opens a menu", async () => {
        const api = new DesktopUpdateApiMock({
            type: "available",
            version: "1.12.0",
        });
        let context: UpdatePresentationContext = "gameplay";
        const playerActions = createPlayerActions(() => context);
        const controller = new DesktopUpdateController(
            api,
            playerActions,
            new NotificationManagerMock(),
            new SoundPlayerMock(),
        );

        await controller.start();
        expect(document.querySelector("dialog")?.hasAttribute("open")).toBe(false);

        context = "mainMenu";
        controller.refreshPresentation();

        expect(document.querySelector("dialog")?.hasAttribute("open")).toBe(true);
        expect(Array.from(document.querySelectorAll("button")).some((button) => button.title.length > 0)).toBe(true);
        expect(
            Array.from(document.querySelectorAll("button")).some(
                (button) => button.textContent === i18n.t("desktopUpdate:downloadLatestCommanderBackup"),
            ),
        ).toBe(true);
        expect(document.querySelectorAll("menu")).toHaveLength(1);
        expect(document.querySelectorAll("p br")).toHaveLength(1);
        document.querySelector("a")?.click();
        expect(api.openReleasePage).toHaveBeenCalledOnce();
        expect(api.download).not.toHaveBeenCalled();
    });

    it("keeps download progress blocking until the player cancels", async () => {
        const api = new DesktopUpdateApiMock({ type: "idle" });
        let context: UpdatePresentationContext = "pauseMenu";
        const playerActions = createPlayerActions(() => context);
        const controller = new DesktopUpdateController(
            api,
            playerActions,
            new NotificationManagerMock(),
            new SoundPlayerMock(),
        );
        await controller.start();

        api.emit({
            type: "downloading",
            version: "1.12.0",
            percent: 42,
        });
        expect(document.querySelector("dialog")?.hasAttribute("open")).toBe(true);

        context = "gameplay";
        controller.refreshPresentation();
        expect(document.querySelector("dialog")?.hasAttribute("open")).toBe(true);
        const progressBar = document.querySelector<HTMLElement>(".desktopUpdateProgressBar");
        expect(progressBar?.style.getPropertyValue("--progress")).toBe("42%");
        expect(progressBar?.getAttribute("aria-valuenow")).toBe("42");
        expect(document.querySelectorAll("button")).toHaveLength(1);
        expect(document.querySelector("button")?.textContent).toBe(i18n.t("common:cancel"));

        const dialog = document.querySelector("dialog");
        const cancelEvent = new Event("cancel", { cancelable: true });
        dialog?.dispatchEvent(cancelEvent);
        expect(cancelEvent.defaultPrevented).toBe(true);
        expect(dialog?.hasAttribute("open")).toBe(true);

        const cancelButton = document.querySelector("button");
        api.emit({
            type: "downloading",
            version: "1.12.0",
            percent: 43,
        });
        expect(document.querySelector("button")).toBe(cancelButton);
        expect(progressBar?.style.getPropertyValue("--progress")).toBe("43%");

        cancelButton?.click();
        expect(api.cancelDownload).toHaveBeenCalledOnce();
    });

    it("distinguishes a failed download from the unchanged installation", async () => {
        const api = new DesktopUpdateApiMock({
            type: "downloadError",
            version: "1.12.0",
        });
        const controller = new DesktopUpdateController(
            api,
            createPlayerActions(() => "mainMenu"),
            new NotificationManagerMock(),
            new SoundPlayerMock(),
        );

        await controller.start();

        const paragraphs = document.querySelectorAll("dialog p");
        expect(paragraphs).toHaveLength(2);
        expect(paragraphs[0]?.textContent).toBe(i18n.t("desktopUpdate:installationUnchangedAfterDownloadFailure"));
        expect(paragraphs[1]?.textContent).toBe(i18n.t("desktopUpdate:downloadCanBeRetried"));
    });
});

function createPlayerActions(getContext: () => UpdatePresentationContext): DesktopUpdatePlayerActions {
    return {
        getPresentationContext: getContext,
        canBackupCurrentCommander: () => true,
        downloadCommanderBackup: () => Promise.resolve(true),
        prepareImmediateInstall: () => Promise.resolve(true),
    };
}
