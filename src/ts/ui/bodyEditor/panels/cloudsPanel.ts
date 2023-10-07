import { EditorPanel } from "../editorPanel";
import { clearAllEventListenersById } from "../../../utils/html";
import { TelluricPlanemo } from "../../../view/bodies/planemos/telluricPlanemo";
import { Settings } from "../../../settings";
import { Slider } from "handle-sliderjs";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CloudsPostProcess } from "../../../view/postProcesses/volumetricCloudsPostProcess";

export class CloudsPanel extends EditorPanel {
    constructor() {
        super("clouds");
    }
    init(planet: TelluricPlanemo, flatClouds: CloudsPostProcess) {
        for (const slider of this.sliders) slider.remove();

        const cloudsToggler = clearAllEventListenersById("cloudsToggler");
        cloudsToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[1] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            flatClouds.cloudUniforms.cloudLayerRadius = checkbox.checked ? planet.getBoundingRadius() + Settings.CLOUD_LAYER_HEIGHT : 0;
        });
        const cloudColorPicker = clearAllEventListenersById("cloudColor") as HTMLInputElement;
        cloudColorPicker.value = flatClouds.cloudUniforms.cloudColor.toHexString();
        cloudColorPicker.addEventListener("input", () => {
            flatClouds.cloudUniforms.cloudColor = Color3.FromHexString(cloudColorPicker.value);
        });
        this.sliders = [
            new Slider("cloudFrequency", document.getElementById("cloudFrequency") as HTMLElement, 0, 20, flatClouds.cloudUniforms.cloudFrequency, (val: number) => {
                flatClouds.cloudUniforms.cloudFrequency = val;
            }),
            new Slider("cloudDetailFrequency", document.getElementById("cloudDetailFrequency") as HTMLElement, 0, 50, flatClouds.cloudUniforms.cloudDetailFrequency, (val: number) => {
                flatClouds.cloudUniforms.cloudDetailFrequency = val;
            }),
            new Slider("cloudCoverage", document.getElementById("cloudCoverage") as HTMLElement, 0, 200, 100 + flatClouds.cloudUniforms.cloudCoverage * 100, (val: number) => {
                flatClouds.cloudUniforms.cloudCoverage = (val - 100) / 100;
            }),
            new Slider("cloudSharpness", document.getElementById("cloudSharpness") as HTMLElement, 1, 100, flatClouds.cloudUniforms.cloudSharpness * 10, (val: number) => {
                flatClouds.cloudUniforms.cloudSharpness = val / 10;
            }),
            new Slider("worleySpeed", document.getElementById("worleySpeed") as HTMLElement, 0.0, 200.0, flatClouds.cloudUniforms.worleySpeed * 10000, (val: number) => {
                flatClouds.cloudUniforms.worleySpeed = val / 10000;
            }),
            new Slider("detailSpeed", document.getElementById("detailSpeed") as HTMLElement, 0, 200, flatClouds.cloudUniforms.detailSpeed * 10000, (val: number) => {
                flatClouds.cloudUniforms.detailSpeed = val / 10000;
            })
        ];
    }
}
