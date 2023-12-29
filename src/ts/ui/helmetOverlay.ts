import overlayHTML from "../../html/helmetOverlay.html";
import { AbstractObject } from "../bodies/abstractObject";

export class HelmetOverlay {
    private parentNode: HTMLElement;
    private bodyNamePlate: HTMLElement;
    private bodySeedPlate: HTMLElement;

    constructor() {
        if (document.querySelector("#helmetOverlay") === null) {
            document.body.insertAdjacentHTML("beforeend", overlayHTML);
        }
        this.parentNode = document.getElementById("helmetOverlay") as HTMLElement;
        this.bodyNamePlate = document.getElementById("bodyName") as HTMLElement;
        this.bodySeedPlate = document.getElementById("bodySeed") as HTMLElement;
        this.bodySeedPlate.addEventListener("click", () => {
            const seed = this.bodySeedPlate.innerText.replace("Seed: ", "");
            if (seed.length > 0) navigator.clipboard.writeText(seed);
        });
    }

    public setVisibility(visible: boolean) {
        this.parentNode.style.visibility = visible ? "visible" : "hidden";
    }

    public isVisible(): boolean {
        return this.parentNode.style.visibility === "visible";
    }

    public update(currentBody: AbstractObject) {
        this.bodyNamePlate.innerText = currentBody.name;
        this.bodySeedPlate.innerText = `Seed: ${currentBody.model.seed.toString()}`;
    }
}
