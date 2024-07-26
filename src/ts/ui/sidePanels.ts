import { initSettingsPanel } from "./settingsPanel";
import { TutorialsPanelContent } from "./tutorial/tutorialsPanel";
import { StarSystemView } from "../starSystem/starSystemView";

export const enum PanelType {
    LOAD_SAVE,
    SETTINGS,
    TUTORIALS,
    CONTRIBUTE,
    CREDITS,
    ABOUT
}

export class SidePanels {
    private activeRightPanel: HTMLElement | null = null;
    private readonly loadSavePanel: HTMLElement;
    private readonly settingsPanel: HTMLElement;

    private readonly tutorialsPanel: HTMLElement;
    readonly tutorialsPanelContent: TutorialsPanelContent;

    private readonly contributePanel: HTMLElement;
    private readonly creditsPanel: HTMLElement;
    private readonly aboutPanel: HTMLElement;

    constructor(starSystemView: StarSystemView) {
        const loadSavePanel = document.getElementById("loadSavePanel");
        if (loadSavePanel === null) throw new Error("#loadSavePanel does not exist!");
        this.loadSavePanel = loadSavePanel;

        this.settingsPanel = initSettingsPanel();

        const tutorialsPanel = document.getElementById("tutorials");
        if (tutorialsPanel === null) throw new Error("#tutorials does not exist!");
        this.tutorialsPanel = tutorialsPanel;
        this.tutorialsPanelContent = new TutorialsPanelContent(starSystemView);
        this.tutorialsPanel.appendChild(this.tutorialsPanelContent.htmlRoot);
        this.tutorialsPanelContent.onTutorialSelected.add(() => {
            this.hideActivePanel();
        });

        const contributePanel = document.getElementById("contribute");
        if (contributePanel === null) throw new Error("#contribute does not exist!");
        this.contributePanel = contributePanel;

        const creditsPanel = document.getElementById("credits");
        if (creditsPanel === null) throw new Error("#credits does not exist!");
        this.creditsPanel = creditsPanel;

        const aboutPanel = document.getElementById("about");
        if (aboutPanel === null) throw new Error("#about does not exist!");
        this.aboutPanel = aboutPanel;
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

        if (newPanel === null) throw new Error("Invalid panel type");

        return newPanel;
    }

    public toggleActivePanel(type: PanelType) {
        const newPanel = this.panelFromType(type);
        if (this.activeRightPanel === newPanel) {
            this.hideActivePanel();
            return;
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
