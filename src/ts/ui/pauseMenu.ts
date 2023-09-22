import { Observable } from "@babylonjs/core/Misc/observable";
import pauseMenuHTML from "../../html/pauseMenu.html";

export class PauseMenu {
    private readonly rootNode: HTMLElement;
    private readonly mask: HTMLElement;

    private readonly screenshotButton: HTMLElement;
    private readonly shareButton: HTMLElement;
    private readonly resumeButton: HTMLElement;

    readonly onScreenshot = new Observable<void>();
    readonly onShare = new Observable<void>();
    readonly onResume = new Observable<void>();

    constructor() {
        document.body.insertAdjacentHTML("beforeend", pauseMenuHTML);
        this.rootNode = document.getElementById("pauseMenu") as HTMLElement;
        this.mask = document.getElementById("pauseMask") as HTMLElement;

        this.screenshotButton = document.getElementById("screenshotButton") as HTMLElement;
        this.screenshotButton.addEventListener("click", () => this.onScreenshot.notifyObservers());

        this.shareButton = document.getElementById("shareButton") as HTMLElement;
        this.shareButton.addEventListener("click", () => this.onShare.notifyObservers());

        this.resumeButton = document.getElementById("resumeButton") as HTMLElement;
        this.resumeButton.addEventListener("click", () => this.onResume.notifyObservers());

        this.setVisibility(false);
    }

    public setVisibility(visible: boolean) {
        this.rootNode.style.display = visible ? "grid" : "none";
        this.mask.style.display = visible ? "block" : "none";
    }

    public isVisible(): boolean {
        return this.rootNode.style.visibility !== "none";
    }
}
