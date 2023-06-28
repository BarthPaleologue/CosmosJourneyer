import { EditorPanel } from "../editorPanel";
import { Slider } from "handle-sliderjs";
import { TelluricPlanemo } from "../../../view/bodies/planemos/telluricPlanemo";

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
                planet.model.physicalProperties.minTemperature,
                (val: number) => {
                    planet.model.physicalProperties.minTemperature = val;
                    planet.material.updateConstants();
                }
            ),
            new Slider(
                "maxTemperature",
                document.getElementById("maxTemperature") as HTMLElement,
                -273,
                300,
                planet.model.physicalProperties.maxTemperature,
                (val: number) => {
                    planet.model.physicalProperties.maxTemperature = val;
                    planet.material.updateConstants();
                }
            )
        ];
    }
}
