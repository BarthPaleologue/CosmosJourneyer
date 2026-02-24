import { Observable } from "@babylonjs/core/Misc/observable";
import { type IDisposable } from "@babylonjs/core/scene";

import { type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { pressInteractionToStrings } from "@/frontend/helpers/inputControlsString";
import { promptModalBoolean } from "@/frontend/ui/dialogModal";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";

import i18n from "@/i18n";

import { TutorialControlsInputs } from "./tutorialLayerInputs";
import { type Tutorial } from "./tutorials/tutorial";

export class TutorialLayer implements IDisposable {
    readonly root: HTMLDivElement;

    private readonly soundPlayer: ISoundPlayer;

    private readonly panel: HTMLDivElement;

    private readonly title: HTMLHeadingElement;

    private readonly contentContainer: HTMLDivElement;

    private readonly controls: HTMLDivElement;

    private readonly prevButton: HTMLElement;

    private readonly nextButton: HTMLElement;

    private tutorialPanelsHtml: string[] = [];

    private currentPanelIndex = 0;

    readonly onQuitTutorial: Observable<void> = new Observable();

    constructor(soundPlayer: ISoundPlayer) {
        this.soundPlayer = soundPlayer;

        this.root = document.createElement("div");
        this.root.classList.add("tutorialLayer");

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

        this.prevButton = document.createElement("p");
        const prevButtonTextSpan = document.createElement("span");
        prevButtonTextSpan.innerText = i18n.t("tutorials:common:previous");
        this.prevButton.appendChild(prevButtonTextSpan);

        this.nextButton = document.createElement("p");
        const nextButtonTextSpan = document.createElement("span");
        nextButtonTextSpan.innerText = i18n.t("tutorials:common:next");
        this.nextButton.appendChild(nextButtonTextSpan);

        void getGlobalKeyboardLayoutMap().then((keyboardLayoutMap) => {
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

        this.controls.appendChild(this.prevButton);
        this.controls.appendChild(this.nextButton);

        this.panel.appendChild(this.controls);

        this.root.appendChild(this.panel);

        TutorialControlsInputs.map.prevPanel.on("complete", () => {
            if (this.currentPanelIndex === 0) {
                return;
            }

            this.currentPanelIndex = Math.max(0, this.currentPanelIndex - 1);
            this.updatePanelState();
            this.prevButton.animate(
                [{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }],
                {
                    duration: 200,
                    easing: "ease",
                },
            );
            this.soundPlayer.playNow("click");
        });

        TutorialControlsInputs.map.nextPanel.on("complete", async () => {
            if (this.currentPanelIndex === this.tutorialPanelsHtml.length - 1) {
                TutorialControlsInputs.setEnabled(false);
                if (await promptModalBoolean(i18n.t("tutorials:common:quitConfirm"), this.soundPlayer)) {
                    this.quitTutorial();
                    return;
                }

                TutorialControlsInputs.setEnabled(true);

                return;
            }

            this.currentPanelIndex = Math.min(this.tutorialPanelsHtml.length - 1, this.currentPanelIndex + 1);
            this.updatePanelState();
            this.nextButton.animate(
                [{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }],
                {
                    duration: 200,
                    easing: "ease",
                },
            );
            this.soundPlayer.playNow("click");
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
        this.soundPlayer.playNow("click");
        this.onQuitTutorial.notifyObservers();
    }

    public setEnabled(enabled: boolean) {
        this.panel.classList.toggle("hidden", !enabled);
        TutorialControlsInputs.setEnabled(enabled);
    }

    public isEnabled() {
        return this.root.style.display === "block";
    }

    private updatePanelState() {
        this.contentContainer.innerHTML =
            this.tutorialPanelsHtml[this.currentPanelIndex] ?? "ERROR: panels out of bounds";

        this.prevButton.classList.toggle("disabled", this.currentPanelIndex === 0);
    }

    dispose(): void {
        this.root.remove();
        this.onQuitTutorial.clear();
    }
}
