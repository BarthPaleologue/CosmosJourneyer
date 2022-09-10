import { EditorPanel } from "../editorPanel";
import { Star } from "../../../bodies/stars/star";
import { Slider } from "handle-sliderjs";

export class StarPanel extends EditorPanel {
    constructor() {
        super("starPhysic");
    }
    init(star: Star) {
        for (const slider of this.sliders) slider.remove();
        this.sliders = [
            new Slider("temperature", document.getElementById("temperature") as HTMLElement, 3000, 15000, star.physicalProperties.temperature, (val: number) => {
                star.physicalProperties.temperature = val;
            }),
            new Slider("starExposure", document.getElementById("starExposure") as HTMLElement, 0, 200, star.postProcesses.volumetricLight.exposure * 100, (val: number) => {
                star.postProcesses.volumetricLight.exposure = val / 100;
            }),
            new Slider("decay", document.getElementById("decay") as HTMLElement, 0, 200, star.postProcesses.volumetricLight.decay * 100, (val: number) => {
                star.postProcesses.volumetricLight.decay = val / 100;
            })
        ];
    }
}