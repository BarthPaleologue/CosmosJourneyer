import { type ISaveManager } from "@/backend/save/saveManager";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { type ISoundPlayer } from "@/frontend/audio/soundPlayer";

import { type MusicConductor } from "../audio/musicConductor";
import { SaveLoadingPanelContent } from "./saveLoadingPanelContent";
import { initSettingsPanel } from "./settingsPanel";
import { TutorialsPanelContent } from "./tutorial/tutorialsPanelContent";

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

    private readonly loadSavePanel: HTMLElement;
    readonly loadSavePanelContent: SaveLoadingPanelContent;

    private readonly settingsPanel: HTMLElement;

    private readonly tutorialsPanel: HTMLElement;
    readonly tutorialsPanelContent: TutorialsPanelContent;

    private readonly contributePanel: HTMLElement;
    private readonly creditsPanel: HTMLElement;
    private readonly aboutPanel: HTMLElement;

    private readonly starSystemDatabase: StarSystemDatabase;

    private readonly saveManager: ISaveManager;

    constructor(
        starSystemDatabase: StarSystemDatabase,
        saveManager: ISaveManager,
        soundPlayer: ISoundPlayer,
        musicConductor: MusicConductor,
    ) {
        this.starSystemDatabase = starSystemDatabase;
        this.saveManager = saveManager;

        const loadSavePanel = document.getElementById("loadSavePanel");
        if (loadSavePanel === null) throw new Error("#loadSavePanel does not exist!");
        this.loadSavePanel = loadSavePanel;
        this.attachCloseButton(this.loadSavePanel);

        this.loadSavePanelContent = new SaveLoadingPanelContent(starSystemDatabase, soundPlayer);
        this.loadSavePanel.appendChild(this.loadSavePanelContent.htmlRoot);

        this.settingsPanel = initSettingsPanel(musicConductor);
        this.attachCloseButton(this.settingsPanel);

        const tutorialsPanel = document.getElementById("tutorials");
        if (tutorialsPanel === null) throw new Error("#tutorials does not exist!");
        this.tutorialsPanel = tutorialsPanel;
        this.attachCloseButton(this.tutorialsPanel);
        this.tutorialsPanelContent = new TutorialsPanelContent();
        this.tutorialsPanel.appendChild(this.tutorialsPanelContent.htmlRoot);

        const contributePanel = document.getElementById("contribute");
        if (contributePanel === null) throw new Error("#contribute does not exist!");
        this.contributePanel = contributePanel;
        this.attachCloseButton(this.contributePanel);

        const creditsPanel = document.getElementById("credits");
        if (creditsPanel === null) throw new Error("#credits does not exist!");
        this.creditsPanel = creditsPanel;
        this.attachCloseButton(this.creditsPanel);

        const aboutPanel = document.getElementById("about");
        if (aboutPanel === null) throw new Error("#about does not exist!");
        this.aboutPanel = aboutPanel;
        this.attachCloseButton(this.aboutPanel);
    }

    private panelFromType(type: PanelType): HTMLElement {
        let newPanel: HTMLElement | null = null;
        switch (type) {
            case PanelType.LOAD_SAVE:
                newPanel = this.loadSavePanel;
                break;
            case PanelType.SETTINGS:
                newPanel = this.settingsPanel;
                break;
            case PanelType.TUTORIALS:
                newPanel = this.tutorialsPanel;
                break;
            case PanelType.CONTRIBUTE:
                newPanel = this.contributePanel;
                break;
            case PanelType.CREDITS:
                newPanel = this.creditsPanel;
                break;
            case PanelType.ABOUT:
                newPanel = this.aboutPanel;
                break;
        }

        return newPanel;
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

    public toggleActivePanel(type: PanelType) {
        const newPanel = this.panelFromType(type);
        if (this.activeRightPanel === newPanel) {
            return;
        }

        if (type === PanelType.LOAD_SAVE) {
            this.loadSavePanelContent.populateCmdrList(this.starSystemDatabase, this.saveManager);
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
