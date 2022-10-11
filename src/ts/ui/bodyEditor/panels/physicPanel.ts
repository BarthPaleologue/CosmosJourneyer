import { EditorPanel } from "../editorPanel";
import { Slider } from "handle-sliderjs";
import { TelluricPlanet } from "../../../bodies/planets/telluricPlanet";

export class PhysicPanel extends EditorPanel {
    constructor() {
        super("physic");
    }
    init(planet: TelluricPlanet) {
        for (const slider of this.sliders) slider.remove();

        this.sliders = [
            new Slider("minTemperature", document.getElementById("minTemperature") as HTMLElement, -273, 300, planet.physicalProperties.minTemperature, (val: number) => {
                planet.physicalProperties.minTemperature = val;
                planet.material.updateConstants();
            }),
            new Slider("maxTemperature", document.getElementById("maxTemperature") as HTMLElement, -273, 300, planet.physicalProperties.maxTemperature, (val: number) => {
                planet.physicalProperties.maxTemperature = val;
                planet.material.updateConstants();
            })
        ];
    }
}
