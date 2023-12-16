import { EditorPanel } from "../editorPanel";
import { Slider } from "handle-sliderjs";
import { BlackHolePostProcess } from "../../../postProcesses/blackHolePostProcess";
import { BlackHole } from "../../../stellarObjects/blackHole/blackHole";

export class BlackholePanel extends EditorPanel {
    constructor() {
        super("blackHolePhysic");
    }
    init(blackhole: BlackHole, blackHole: BlackHolePostProcess) {
        for (const slider of this.sliders) slider.remove();

        this.sliders = [
            new Slider("diskRadius", document.getElementById("diskRadius") as HTMLElement, 0e3, 1000, blackHole.blackHoleUniforms.accretionDiskRadius / 1e5, (val: number) => {
                blackHole.blackHoleUniforms.accretionDiskRadius = val * 1e5;
            })
        ];
    }
}
