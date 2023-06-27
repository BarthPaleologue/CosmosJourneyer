import { EditorPanel } from "../editorPanel";
import { clearAllEventListenersById } from "../../../utils/html";
import { AbstractBody } from "../../../bodies/abstractBody";
import { Slider } from "handle-sliderjs";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { RingsPostProcess } from "../../../postProcesses/ringsPostProcess";

export class RingsPanel extends EditorPanel {
    constructor() {
        super("rings");
    }
    init(body: AbstractBody, rings: RingsPostProcess) {
        for (const slider of this.sliders) slider.remove();

        const ringsToggler = clearAllEventListenersById("ringsToggler");
        ringsToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[3] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            rings.settings.ringFrequency = checkbox.checked ? 30 : 0;
        });

        const snowColorPicker = clearAllEventListenersById("ringColor") as HTMLInputElement;
        snowColorPicker.value = rings.settings.ringColor.toHexString();
        snowColorPicker.addEventListener("input", () => {
            rings.settings.ringColor.copyFrom(Color3.FromHexString(snowColorPicker.value));
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
