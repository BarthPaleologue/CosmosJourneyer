import { EditorPanel } from "../editorPanel";
import { Slider } from "handle-sliderjs";
import { PostProcessManager } from "../../../postProcesses/postProcessManager";
import { BlackHole } from "../../../bodies/stellarObjects/blackHole";

export class BlackholePanel extends EditorPanel {
    constructor() {
        super("blackHolePhysic");
    }
    init(blackhole: BlackHole, postProcessManager: PostProcessManager) {
        for (const slider of this.sliders) slider.remove();

        const blackHolePostProcess = postProcessManager.getBlackHole(blackhole);

        this.sliders = [
            new Slider("diskRadius", document.getElementById("diskRadius") as HTMLElement, 0e3, 1000, blackHolePostProcess.settings.accretionDiskRadius / 1e5, (val: number) => {
                blackHolePostProcess.settings.accretionDiskRadius = val * 1e5;
            })
        ];
    }
}
