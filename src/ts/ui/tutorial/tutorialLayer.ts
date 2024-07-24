import { IDisposable } from "@babylonjs/core";
import { pressInteractionToStrings } from "../../utils/inputControlsString";
import { TutorialControlsInputs } from "./tutorialLayerInputs";

export class TutorialLayer implements IDisposable {
    private readonly layerRoot: HTMLDivElement;

    private readonly panel: HTMLDivElement;

    private readonly title: HTMLHeadingElement;

    private readonly contentContainer: HTMLDivElement;

    private readonly controls: HTMLDivElement;

    private readonly tutorialPanels: HTMLDivElement[];

    private currentPanelIndex = 0;

    constructor(tutorialName: string, tutorialPanels: HTMLDivElement[]) {
        this.layerRoot = document.createElement("div");
        this.layerRoot.classList.add("tutorialLayer");

        this.panel = document.createElement("div");
        this.panel.classList.add("tutorialPanel");

        this.title = document.createElement("h1");
        this.title.innerText = tutorialName;
        this.panel.appendChild(this.title);

        this.contentContainer = document.createElement("div");
        this.contentContainer.classList.add("tutorialContentContainer");
        this.panel.appendChild(this.contentContainer);

        this.controls = document.createElement("div");
        this.controls.classList.add("tutorialControls");

        const stopButton = document.createElement("p");
        const stopButtonTextSpan = document.createElement("span");
        stopButtonTextSpan.innerText = "Quit";
        stopButton.appendChild(stopButtonTextSpan);

        pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial).forEach((key) => {
            const stopKeySpan = document.createElement("span");
            stopKeySpan.classList.add("keySpan");
            stopKeySpan.innerText = key;
            stopButton.appendChild(stopKeySpan);
        });

        const prevButton = document.createElement("p");
        const prevButtonTextSpan = document.createElement("span");
        prevButtonTextSpan.innerText = "Previous";
        prevButton.appendChild(prevButtonTextSpan);

        pressInteractionToStrings(TutorialControlsInputs.map.prevPanel).forEach((key) => {
            const prevKeySpan = document.createElement("span");
            prevKeySpan.classList.add("keySpan");
            prevKeySpan.innerText = key;
            prevButton.appendChild(prevKeySpan);
        });

        const nextButton = document.createElement("p");
        const nextButtonTextSpan = document.createElement("span");
        nextButtonTextSpan.innerText = "Next";
        nextButton.appendChild(nextButtonTextSpan);

        pressInteractionToStrings(TutorialControlsInputs.map.nextPanel).forEach((key) => {
            const nextKeySpan = document.createElement("span");
            nextKeySpan.classList.add("keySpan");
            nextKeySpan.innerText = key;
            nextButton.appendChild(nextKeySpan);
        });

        this.controls.appendChild(stopButton);
        this.controls.appendChild(prevButton);
        this.controls.appendChild(nextButton);

        this.panel.appendChild(this.controls);

        this.layerRoot.appendChild(this.panel);

        this.tutorialPanels = tutorialPanels;

        document.body.appendChild(this.layerRoot);
    }

    public setEnabled(enabled: boolean) {
        this.layerRoot.style.display = enabled ? "block" : "none";
    }

    public isEnabled() {
        return this.layerRoot.style.display === "block";
    }

    public update() {
        this.contentContainer.innerHTML = "";
        this.contentContainer.appendChild(this.tutorialPanels[this.currentPanelIndex]);
    }

    dispose(): void {
        this.layerRoot.remove();
    }
}