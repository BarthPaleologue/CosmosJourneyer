import { pressInteractionToStrings } from "../../utils/strings/inputControlsString";
import { TutorialControlsInputs } from "./tutorialLayerInputs";
import i18n from "../../i18n";
import { Sounds } from "../../assets/sounds";
import { IDisposable } from "@babylonjs/core/scene";
import { getGlobalKeyboardLayoutMap } from "../../utils/keyboardAPI";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Tutorial } from "../../tutorials/tutorial";

export class TutorialLayer implements IDisposable {
    private readonly layerRoot: HTMLDivElement;

    private readonly panel: HTMLDivElement;

    private readonly title: HTMLHeadingElement;

    private readonly contentContainer: HTMLDivElement;

    private readonly controls: HTMLDivElement;

    private readonly quitButton: HTMLElement;

    private readonly prevButton: HTMLElement;

    private readonly nextButton: HTMLElement;

    private tutorialPanelsHtml: string[] = [];

    private currentPanelIndex = 0;

    readonly onQuitTutorial: Observable<void> = new Observable();

    constructor() {
        this.layerRoot = document.createElement("div");
        this.layerRoot.classList.add("tutorialLayer");

        this.panel = document.createElement("div");
        this.panel.classList.add("tutorialPanel");
        this.panel.classList.add("hidden");

        this.title = document.createElement("h1");
        this.title.innerText = "Tutorial";
        this.panel.appendChild(this.title);

        this.contentContainer = document.createElement("div");
        this.contentContainer.classList.add("tutorialContentContainer");
        this.panel.appendChild(this.contentContainer);

        this.controls = document.createElement("div");
        this.controls.classList.add("tutorialControls");

        this.quitButton = document.createElement("p");
        const stopButtonTextSpan = document.createElement("span");
        stopButtonTextSpan.innerText = i18n.t("tutorials:common:quit");
        this.quitButton.appendChild(stopButtonTextSpan);

        this.prevButton = document.createElement("p");
        const prevButtonTextSpan = document.createElement("span");
        prevButtonTextSpan.innerText = i18n.t("tutorials:common:previous");
        this.prevButton.appendChild(prevButtonTextSpan);

        this.nextButton = document.createElement("p");
        const nextButtonTextSpan = document.createElement("span");
        nextButtonTextSpan.innerText = i18n.t("tutorials:common:next");
        this.nextButton.appendChild(nextButtonTextSpan);

        void getGlobalKeyboardLayoutMap().then((keyboardLayoutMap) => {
            pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial, keyboardLayoutMap).forEach((key) => {
                const stopKeySpan = document.createElement("span");
                stopKeySpan.classList.add("keySpan");
                stopKeySpan.innerText = key;
                this.quitButton.appendChild(stopKeySpan);
            });

            pressInteractionToStrings(TutorialControlsInputs.map.prevPanel, keyboardLayoutMap).forEach((key) => {
                const prevKeySpan = document.createElement("span");
                prevKeySpan.classList.add("keySpan");
                prevKeySpan.innerText = key;
                this.prevButton.appendChild(prevKeySpan);
            });

            pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).forEach((key) => {
                const nextKeySpan = document.createElement("span");
                nextKeySpan.classList.add("keySpan");
                nextKeySpan.innerText = key;
                this.nextButton.appendChild(nextKeySpan);
            });
        });

        this.controls.appendChild(this.quitButton);
        this.controls.appendChild(this.prevButton);
        this.controls.appendChild(this.nextButton);

        this.panel.appendChild(this.controls);

        this.layerRoot.appendChild(this.panel);

        document.body.appendChild(this.layerRoot);

        TutorialControlsInputs.map.quitTutorial.on("complete", () => {
            this.quitTutorial();
        });

        TutorialControlsInputs.map.prevPanel.on("complete", () => {
            this.currentPanelIndex = Math.max(0, this.currentPanelIndex - 1);
            this.updatePanelState();
            this.prevButton.animate(
                [{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }],
                {
                    duration: 200,
                    easing: "ease"
                }
            );
            Sounds.MENU_SELECT_SOUND.play();
        });

        TutorialControlsInputs.map.nextPanel.on("complete", () => {
            this.currentPanelIndex = Math.min(this.tutorialPanelsHtml.length - 1, this.currentPanelIndex + 1);
            this.updatePanelState();
            this.nextButton.animate(
                [{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }],
                {
                    duration: 200,
                    easing: "ease"
                }
            );
            Sounds.MENU_SELECT_SOUND.play();
        });
    }

    public async setTutorial(tutorial: Tutorial) {
        if (this.isEnabled()) this.quitTutorial();
        this.title.innerText = tutorial.getTitle();
        this.tutorialPanelsHtml = await tutorial.getContentPanelsHtml();
        this.currentPanelIndex = 0;
        this.updatePanelState();
        this.setEnabled(true);
    }

    public quitTutorial() {
        this.setEnabled(false);
        this.quitButton.animate([{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }], {
            duration: 200,
            easing: "ease"
        });
        Sounds.MENU_SELECT_SOUND.play();

        this.onQuitTutorial.notifyObservers();
    }

    public setEnabled(enabled: boolean) {
        this.panel.classList.toggle("hidden", !enabled);
        TutorialControlsInputs.setEnabled(enabled);
    }

    public isEnabled() {
        return this.layerRoot.style.display === "block";
    }

    private updatePanelState() {
        this.contentContainer.innerHTML = this.tutorialPanelsHtml[this.currentPanelIndex];
    }

    dispose(): void {
        this.layerRoot.remove();
        this.onQuitTutorial.clear();
    }
}
