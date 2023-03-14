import { EditorPanel } from "../editorPanel";
import { Slider } from "handle-sliderjs";
import { TelluricPlanemo } from "../../../bodies/planemos/telluricPlanemo";

export class PhysicPanel extends EditorPanel {
    constructor() {
        super("physic");
    }
    init(planet: TelluricPlanemo) {
        for (const slider of this.sliders) slider.remove();

        this.sliders = [
            new Slider(
                "minTemperature",
                document.getElementById("minTemperature") as HTMLElement,
                -273,
                300,
                planet.descriptor.physicalProperties.minTemperature,
                (val: number) => {
                    planet.descriptor.physicalProperties.minTemperature = val;
                    planet.material.updateConstants();
                }
            ),
            new Slider(
                "maxTemperature",
                document.getElementById("maxTemperature") as HTMLElement,
                -273,
                300,
                planet.descriptor.physicalProperties.maxTemperature,
                (val: number) => {
                    planet.descriptor.physicalProperties.maxTemperature = val;
                    planet.material.updateConstants();
                }
            )
        ];
    }
}
