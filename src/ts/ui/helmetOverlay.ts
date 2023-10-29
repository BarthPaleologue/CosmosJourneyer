import overlayHTML from "../../html/helmetOverlay.html";
import { AbstractBody } from "../view/bodies/abstractBody";
import { AbstractObject } from "../view/bodies/abstractObject";

export class HelmetOverlay {
    private readonly parentNode: HTMLElement;
    private readonly bodyNamePlate: HTMLElement;
    private readonly bodySeedPlate: HTMLElement;

    constructor() {
        document.body.insertAdjacentHTML("beforeend", overlayHTML);
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
