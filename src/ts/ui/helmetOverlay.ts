import overlayHTML from "../../html/helmetOverlay.html";
import { OrbitalObject } from "../architecture/orbitalObject";

export class HelmetOverlay {
    private readonly parentNode: HTMLElement;
    private readonly bodyNamePlate: HTMLElement;

    constructor() {
        document.body.insertAdjacentHTML("beforeend", overlayHTML);
        this.parentNode = document.getElementById("helmetOverlay") as HTMLElement;
        this.bodyNamePlate = document.getElementById("bodyName") as HTMLElement;
    }

    public setVisibility(visible: boolean) {
        this.parentNode.style.visibility = visible ? "visible" : "hidden";
    }

    public isVisible(): boolean {
        return this.parentNode.style.visibility === "visible";
    }

    public update(currentBody: OrbitalObject) {
        this.bodyNamePlate.innerText = currentBody.name;
    }
}
