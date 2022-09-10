import { Slider } from "handle-sliderjs";
import { AbstractBody } from "../../bodies/abstractBody";

export class EditorPanel {
    sliders: Slider[] = [];
    anchor: HTMLElement;
    panel: HTMLElement;
    isPanelVisible: boolean = false;
    constructor(id: string) {
        this.anchor = document.getElementById(id + "Link") as HTMLElement;
        this.panel = document.getElementById(id + "UI") as HTMLElement;
    }
    init(body: AbstractBody) {}
    updateAllSliders() {
        for (const slider of this.sliders) slider.update(false);
    }
    show() {
        this.setVisibility(true);
    }
    hide() {
        this.setVisibility(false);
    }
    setVisibility(visible: boolean) {
        this.panel.style.zIndex = visible ? "15" : "-1";
        this.isPanelVisible = visible;
    }
    setEnabled(enabled: boolean) {
        this.anchor.hidden = !enabled;
        if(!enabled) this.hide();
    }
    disable() {
        this.setEnabled(false);
    }
    enable() {
        this.setEnabled(true);
    }
}