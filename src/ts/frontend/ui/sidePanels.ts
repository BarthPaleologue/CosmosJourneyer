import { type ISaveBackend } from "@/backend/save/saveBackend";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { type ISoundPlayer } from "@/frontend/audio/soundPlayer";

import { assertUnreachable } from "@/utils/types";

import { type MusicConductor } from "../audio/musicConductor";
import { AboutPanel } from "./panels/aboutPanel";
import { ContributePanel } from "./panels/contributePanel";
import { CreditsPanel } from "./panels/creditsPanel";
import { LoadSavePanel } from "./panels/loadSavePanel";
import { SettingsPanel } from "./panels/settingsPanel";
import { TutorialsPanel } from "./panels/tutorialsPanel";

export const enum PanelType {
    LOAD_SAVE,
    SETTINGS,
    TUTORIALS,
    CONTRIBUTE,
    CREDITS,
    ABOUT,
}

export class SidePanels {
    private activeRightPanel: HTMLElement | null = null;

    readonly loadSavePanel: LoadSavePanel;
    readonly settingsPanel: SettingsPanel;
    readonly tutorialsPanel: TutorialsPanel;
    readonly contributePanel: ContributePanel;
    readonly creditsPanel: CreditsPanel;
    readonly aboutPanel: AboutPanel;

    private readonly starSystemDatabase: StarSystemDatabase;
    private readonly saveBackend: ISaveBackend;

    constructor(
        starSystemDatabase: StarSystemDatabase,
        saveManager: ISaveBackend,
        soundPlayer: ISoundPlayer,
        musicConductor: MusicConductor,
    ) {
        this.starSystemDatabase = starSystemDatabase;
        this.saveBackend = saveManager;

        // Create panel instances
        this.loadSavePanel = new LoadSavePanel(starSystemDatabase, soundPlayer);
        this.attachCloseButton(this.loadSavePanel.htmlRoot);
        document.body.appendChild(this.loadSavePanel.htmlRoot);

        this.settingsPanel = new SettingsPanel(musicConductor);
        this.attachCloseButton(this.settingsPanel.htmlRoot);
        document.body.appendChild(this.settingsPanel.htmlRoot);

        this.tutorialsPanel = new TutorialsPanel();
        this.attachCloseButton(this.tutorialsPanel.htmlRoot);
        document.body.appendChild(this.tutorialsPanel.htmlRoot);

        this.contributePanel = new ContributePanel();
        this.attachCloseButton(this.contributePanel.htmlRoot);
        document.body.appendChild(this.contributePanel.htmlRoot);

        this.creditsPanel = new CreditsPanel();
        this.attachCloseButton(this.creditsPanel.htmlRoot);
        document.body.appendChild(this.creditsPanel.htmlRoot);

        this.aboutPanel = new AboutPanel();
        this.attachCloseButton(this.aboutPanel.htmlRoot);
        document.body.appendChild(this.aboutPanel.htmlRoot);
    }

    private panelFromType(type: PanelType): HTMLElement {
        switch (type) {
            case PanelType.LOAD_SAVE:
                return this.loadSavePanel.htmlRoot;
            case PanelType.SETTINGS:
                return this.settingsPanel.htmlRoot;
            case PanelType.TUTORIALS:
                return this.tutorialsPanel.htmlRoot;
            case PanelType.CONTRIBUTE:
                return this.contributePanel.htmlRoot;
            case PanelType.CREDITS:
                return this.creditsPanel.htmlRoot;
            case PanelType.ABOUT:
                return this.aboutPanel.htmlRoot;
            default:
                return assertUnreachable(type);
        }
    }

    private attachCloseButton(panel: HTMLElement): void {
        if (panel.querySelector(".close-button")) {
            return;
        }
        const closeButton = document.createElement("button");
        closeButton.innerText = "X";
        closeButton.className = "close-button";
        closeButton.addEventListener("click", () => {
            this.hideActivePanel();
        });
        panel.appendChild(closeButton);
    }

    public async toggleActivePanel(type: PanelType) {
        const newPanel = this.panelFromType(type);
        if (this.activeRightPanel === newPanel) {
            return;
        }

        if (type === PanelType.LOAD_SAVE) {
            await this.loadSavePanel.content.populateCmdrList(this.starSystemDatabase, this.saveBackend);
        }

        if (this.activeRightPanel !== null) {
            this.hideActivePanel();
        }

        this.activeRightPanel = newPanel;
        newPanel.classList.add("visible");
    }

    public hideActivePanel() {
        if (this.activeRightPanel !== null) {
            this.activeRightPanel.classList.remove("visible");
            this.activeRightPanel = null;
        }
    }
}
