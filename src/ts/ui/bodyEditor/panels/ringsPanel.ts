import { EditorPanel } from "../editorPanel";
import { clearAllEventListenersById } from "../../../utils/html";
import { AbstractBody } from "../../../bodies/abstractBody";
import { PostProcessManager } from "../../../postProcesses/postProcessManager";
import { Slider } from "handle-sliderjs";

export class RingsPanel extends EditorPanel {
    constructor() {
        super("rings");
    }
    init(body: AbstractBody, postProcessManager: PostProcessManager) {
        for (const slider of this.sliders) slider.remove();

        if (!body.postProcesses.rings) return;
        const rings = postProcessManager.getRings(body);
        this.enable();

        const ringsToggler = clearAllEventListenersById("ringsToggler");
        ringsToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[3] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            rings.settings.ringFrequency = checkbox.checked ? 30 : 0;
        });
        this.sliders = [
            new Slider("ringsMinRadius", document.getElementById("ringsMinRadius") as HTMLElement, 100, 200, rings.settings.ringStart * 100, (val: number) => {
                rings.settings.ringStart = val / 100;
            }),
            new Slider("ringsMaxRadius", document.getElementById("ringsMaxRadius") as HTMLElement, 150, 400, rings.settings.ringEnd * 100, (val: number) => {
                rings.settings.ringEnd = val / 100;
            }),
            new Slider("ringsFrequency", document.getElementById("ringsFrequency") as HTMLElement, 10, 100, rings.settings.ringFrequency, (val: number) => {
                rings.settings.ringFrequency = val;
            }),
            new Slider("ringsOpacity", document.getElementById("ringsOpacity") as HTMLElement, 0, 100, rings.settings.ringOpacity * 100, (val: number) => {
                rings.settings.ringOpacity = val / 100;
            })
        ];
    }
}
