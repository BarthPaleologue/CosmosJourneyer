import { EditorPanel } from "../editorPanel";
import { Star } from "../../../view/bodies/stellarObjects/star";
import { Slider } from "handle-sliderjs";
import { VolumetricLight } from "../../../view/postProcesses/volumetricLight";

export class StarPanel extends EditorPanel {
    constructor() {
        super("starPhysic");
    }
    init(star: Star, volumetricLight: VolumetricLight) {
        for (const slider of this.sliders) slider.remove();

        this.sliders = [
            new Slider("temperature", document.getElementById("temperature") as HTMLElement, 3000, 15000, star.model.physicalProperties.temperature, (val: number) => {
                star.model.physicalProperties.temperature = val;
            }),
            new Slider("starExposure", document.getElementById("starExposure") as HTMLElement, 0, 200, volumetricLight.exposure * 100, (val: number) => {
                volumetricLight.exposure = val / 100;
            }),
            new Slider("decay", document.getElementById("decay") as HTMLElement, 0, 200, volumetricLight.decay * 100, (val: number) => {
                volumetricLight.decay = val / 100;
            })
        ];
    }
}
