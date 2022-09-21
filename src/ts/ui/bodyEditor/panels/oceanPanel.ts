import { EditorPanel } from "../editorPanel";
import { clearAllEventListenersById } from "../../../utils/html";
import { Slider } from "handle-sliderjs";
import { TelluricPlanet } from "../../../bodies/planets/telluricPlanet";

export class OceanPanel extends EditorPanel {
    constructor() {
        super("ocean");
    }
    init(planet: TelluricPlanet) {
        for (const slider of this.sliders) slider.remove();

        const ocean = planet.postProcesses.ocean;
        if (ocean == null) return;

        const oceanToggler = clearAllEventListenersById("oceanToggler");
        oceanToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[0] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            ocean.settings.oceanRadius = checkbox.checked ? planet.getApparentRadius() : 0;
        });
        this.sliders = [
            new Slider("alphaModifier", document.getElementById("alphaModifier") as HTMLElement, 0, 200, ocean.settings.alphaModifier * 10000, (val: number) => {
                ocean.settings.alphaModifier = val / 10000;
            }),
            new Slider("depthModifier", document.getElementById("depthModifier") as HTMLElement, 0, 70, ocean.settings.depthModifier * 10000, (val: number) => {
                ocean.settings.depthModifier = val / 10000;
            }),
            new Slider("specularPower", document.getElementById("specularPower") as HTMLElement, 0, 100, ocean.settings.specularPower * 10, (val: number) => {
                ocean.settings.specularPower = val / 10;
            }),
            new Slider("smoothness", document.getElementById("smoothness") as HTMLElement, 0, 100, ocean.settings.smoothness * 100, (val: number) => {
                ocean.settings.smoothness = val / 100;
            }),
            new Slider(
                "waveBlendingSharpness",
                document.getElementById("waveBlendingSharpness") as HTMLElement,
                0,
                100,
                ocean.settings.waveBlendingSharpness * 100,
                (val: number) => {
                    ocean.settings.waveBlendingSharpness = val / 100;
                }
            )
        ];

    }
}