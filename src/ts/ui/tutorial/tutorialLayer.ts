import { pressInteractionToStrings } from "../../utils/inputControlsString";
import { TutorialControlsInputs } from "./tutorialLayerInputs";
import i18n from "../../i18n";
import { Sounds } from "../../assets/sounds";
import { IDisposable } from "@babylonjs/core/scene";

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

        pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial, null).forEach((key) => {
            const stopKeySpan = document.createElement("span");
            stopKeySpan.classList.add("keySpan");
            stopKeySpan.innerText = key;
            this.quitButton.appendChild(stopKeySpan);
        });

        this.prevButton = document.createElement("p");
        const prevButtonTextSpan = document.createElement("span");
        prevButtonTextSpan.innerText = i18n.t("tutorials:common:previous");
        this.prevButton.appendChild(prevButtonTextSpan);

        pressInteractionToStrings(TutorialControlsInputs.map.prevPanel, null).forEach((key) => {
            const prevKeySpan = document.createElement("span");
            prevKeySpan.classList.add("keySpan");
            prevKeySpan.innerText = key;
            this.prevButton.appendChild(prevKeySpan);
        });

        this.nextButton = document.createElement("p");
        const nextButtonTextSpan = document.createElement("span");
        nextButtonTextSpan.innerText = i18n.t("tutorials:common:next");
        this.nextButton.appendChild(nextButtonTextSpan);

        pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, null).forEach((key) => {
            const nextKeySpan = document.createElement("span");
            nextKeySpan.classList.add("keySpan");
            nextKeySpan.innerText = key;
            this.nextButton.appendChild(nextKeySpan);
        });

        this.controls.appendChild(this.quitButton);
        this.controls.appendChild(this.prevButton);
        this.controls.appendChild(this.nextButton);

        this.panel.appendChild(this.controls);

        this.layerRoot.appendChild(this.panel);

        document.body.appendChild(this.layerRoot);

        TutorialControlsInputs.map.quitTutorial.on("complete", () => {
            this.setEnabled(false);
            this.quitButton.animate([{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }], {
                duration: 200,
                easing: "ease"
            });
            Sounds.MENU_SELECT_SOUND.play();
        });

        TutorialControlsInputs.map.prevPanel.on("complete", () => {
            this.currentPanelIndex = Math.max(0, this.currentPanelIndex - 1);
            this.updatePanelState();
            this.prevButton.animate([{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }], {
                duration: 200,
                easing: "ease"
            });
            Sounds.MENU_SELECT_SOUND.play();
        });

        TutorialControlsInputs.map.nextPanel.on("complete", () => {
            this.currentPanelIndex = Math.min(this.tutorialPanelsHtml.length - 1, this.currentPanelIndex + 1);
            this.updatePanelState();
            this.nextButton.animate([{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }], {
                duration: 200,
                easing: "ease"
            });
            Sounds.MENU_SELECT_SOUND.play();
        });
    }

    public setTutorial(name: string, panels: string[]) {
        this.title.innerText = name;
        this.tutorialPanelsHtml = panels;
        this.currentPanelIndex = 0;
        this.updatePanelState();
        this.setEnabled(true);
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
    }
}
