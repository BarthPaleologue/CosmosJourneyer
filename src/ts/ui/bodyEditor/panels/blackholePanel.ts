import { EditorPanel } from "../editorPanel";
import { Slider } from "handle-sliderjs";
import { BlackHole } from "../../../view/bodies/stellarObjects/blackHole";
import { BlackHolePostProcess } from "../../../view/postProcesses/blackHolePostProcess";

export class BlackholePanel extends EditorPanel {
    constructor() {
        super("blackHolePhysic");
    }
    init(blackhole: BlackHole, blackHole: BlackHolePostProcess) {
        for (const slider of this.sliders) slider.remove();

        this.sliders = [
            new Slider("diskRadius", document.getElementById("diskRadius") as HTMLElement, 0e3, 1000, blackHole.settings.accretionDiskRadius / 1e5, (val: number) => {
                blackHole.settings.accretionDiskRadius = val * 1e5;
            })
        ];
    }
}
