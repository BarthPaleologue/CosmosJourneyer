import { EditorPanel } from "../editorPanel";
import { clearAllEventListenersById } from "../../../utils/html";
import { Settings } from "../../../settings";
import { Color3 } from "@babylonjs/core";
import { Slider } from "handle-sliderjs";
import { TelluricPlanet } from "../../../bodies/planets/telluricPlanet";

export class CloudsPanel extends EditorPanel {
    constructor() {
        super("clouds");
    }
    init(planet: TelluricPlanet) {
        for (const slider of this.sliders) slider.remove();

        const flatClouds = planet.postProcesses.clouds;
        if (flatClouds == null) return;

        const cloudsToggler = clearAllEventListenersById("cloudsToggler");
        cloudsToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[1] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            flatClouds.settings.cloudLayerRadius = checkbox.checked ? Settings.EARTH_RADIUS + Settings.CLOUD_LAYER_HEIGHT : 0;
        });
        const cloudColorPicker = clearAllEventListenersById("cloudColor") as HTMLInputElement;
        cloudColorPicker.value = flatClouds.settings.cloudColor.toHexString();
        cloudColorPicker.addEventListener("input", () => {
            flatClouds.settings.cloudColor = Color3.FromHexString(cloudColorPicker.value);
        });
        this.sliders = [
            new Slider("cloudFrequency", document.getElementById("cloudFrequency") as HTMLElement, 0, 20, flatClouds.settings.cloudFrequency, (val: number) => {
                flatClouds.settings.cloudFrequency = val;
            }),
            new Slider("cloudDetailFrequency", document.getElementById("cloudDetailFrequency") as HTMLElement, 0, 50, flatClouds.settings.cloudDetailFrequency, (val: number) => {
                flatClouds.settings.cloudDetailFrequency = val;
            }),
            new Slider("cloudCoverage", document.getElementById("cloudCoverage") as HTMLElement, 0, 200, 100 + flatClouds.settings.cloudCoverage * 100, (val: number) => {
                flatClouds.settings.cloudCoverage = (val - 100) / 100;
            }),
            new Slider("cloudSharpness", document.getElementById("cloudSharpness") as HTMLElement, 1, 100, flatClouds.settings.cloudSharpness * 10, (val: number) => {
                flatClouds.settings.cloudSharpness = val / 10;
            }),
            new Slider("worleySpeed", document.getElementById("worleySpeed") as HTMLElement, 0.0, 200.0, flatClouds.settings.worleySpeed * 10000, (val: number) => {
                flatClouds.settings.worleySpeed = val / 10000;
            }),
            new Slider("detailSpeed", document.getElementById("detailSpeed") as HTMLElement, 0, 200, flatClouds.settings.detailSpeed * 10000, (val: number) => {
                flatClouds.settings.detailSpeed = val / 10000;
            })
        ];
    }
}
