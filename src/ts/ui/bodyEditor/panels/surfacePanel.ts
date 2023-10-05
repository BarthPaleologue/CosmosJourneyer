import { EditorPanel } from "../editorPanel";
import { TelluricPlanemo } from "../../../view/bodies/planemos/telluricPlanemo";
import { clearAllEventListenersById } from "../../../utils/html";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Slider } from "handle-sliderjs";

export class SurfacePanel extends EditorPanel {
    constructor() {
        super("surface");
    }
    init(planet: TelluricPlanemo) {
        for (const slider of this.sliders) slider.remove();

        const material = planet.material;
        const colorSettings = material.colorSettings;

        const snowColorPicker = clearAllEventListenersById("snowColor") as HTMLInputElement;
        snowColorPicker.value = colorSettings.snowColor.toHexString();
        snowColorPicker.addEventListener("input", () => {
            colorSettings.snowColor.copyFrom(Color3.FromHexString(snowColorPicker.value));
        });

        const plainColorPicker = clearAllEventListenersById("plainColor") as HTMLInputElement;
        plainColorPicker.value = colorSettings.plainColor.toHexString();
        plainColorPicker.addEventListener("input", () => {
            colorSettings.plainColor.copyFrom(Color3.FromHexString(plainColorPicker.value));
        });

        const steepColorPicker = clearAllEventListenersById("steepColor") as HTMLInputElement;
        steepColorPicker.value = colorSettings.steepColor.toHexString();
        steepColorPicker.addEventListener("input", () => {
            colorSettings.steepColor.copyFrom(Color3.FromHexString(steepColorPicker.value));
        });

        const sandColorPicker = clearAllEventListenersById("sandColor") as HTMLInputElement;
        sandColorPicker.value = colorSettings.beachColor.toHexString();
        sandColorPicker.addEventListener("input", () => {
            colorSettings.beachColor.copyFrom(Color3.FromHexString(sandColorPicker.value));
        });

        const desertColorPicker = clearAllEventListenersById("desertColor") as HTMLInputElement;
        desertColorPicker.value = colorSettings.desertColor.toHexString();
        desertColorPicker.addEventListener("input", () => {
            colorSettings.desertColor.copyFrom(Color3.FromHexString(desertColorPicker.value));
        });

        const bottomColorPicker = clearAllEventListenersById("bottomColor") as HTMLInputElement;
        bottomColorPicker.value = colorSettings.bottomColor.toHexString();
        bottomColorPicker.addEventListener("input", () => {
            colorSettings.bottomColor.copyFrom(Color3.FromHexString(bottomColorPicker.value));
        });

        this.sliders = [
            new Slider("sandSize", document.getElementById("sandSize") as HTMLElement, 0, 300, planet.material.colorSettings.beachSize / 10, (val: number) => {
                colorSettings.beachSize = val * 10;
                material.updateConstants();
            }),
            new Slider("steepSharpness", document.getElementById("steepSharpness") as HTMLElement, 0, 100, planet.material.colorSettings.steepSharpness * 10, (val: number) => {
                colorSettings.steepSharpness = val / 10;
                material.updateConstants();
            }),
            new Slider("normalSharpness", document.getElementById("normalSharpness") as HTMLElement, 0, 100, planet.material.colorSettings.normalSharpness * 100, (val: number) => {
                colorSettings.normalSharpness = val / 100;
                material.updateConstants();
            })
        ];
    }
}
