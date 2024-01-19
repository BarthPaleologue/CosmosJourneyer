import { EditorPanel } from "../editorPanel";
import { clearAllEventListenersById } from "../../../utils/html";
import { Settings } from "../../../settings";
import { Slider } from "handle-sliderjs";
import { AtmosphericScatteringPostProcess } from "../../../postProcesses/atmosphericScatteringPostProcess";
import { CelestialBody } from "../../../architecture/celestialBody";

export class AtmospherePanel extends EditorPanel {
    constructor() {
        super("atmosphere");
    }
    init(planet: CelestialBody, atmosphere: AtmosphericScatteringPostProcess) {
        for (const slider of this.sliders) slider.remove();

        const atmosphereToggler = clearAllEventListenersById("atmosphereToggler");
        atmosphereToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[2] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            atmosphere.atmosphereUniforms.atmosphereRadius = checkbox.checked ? planet.getBoundingRadius() + Settings.ATMOSPHERE_HEIGHT : 0;
        });
        this.sliders = [
            new Slider("intensity", document.getElementById("intensity") as HTMLElement, 0, 40, atmosphere.atmosphereUniforms.intensity, (val: number) => {
                atmosphere.atmosphereUniforms.intensity = val;
            }),
            new Slider("density", document.getElementById("density") as HTMLElement, 0, 40, atmosphere.atmosphereUniforms.densityModifier * 10, (val: number) => {
                atmosphere.atmosphereUniforms.densityModifier = val / 10;
            }),
            new Slider(
                "atmosphereRadius",
                document.getElementById("atmosphereRadius") as HTMLElement,
                0,
                100,
                (atmosphere.atmosphereUniforms.atmosphereRadius - planet.getRadius()) / 10000,
                (val: number) => {
                    atmosphere.atmosphereUniforms.atmosphereRadius = planet.getRadius() + val * 10000;
                }
            ),
            new Slider(
                "rayleighStrength",
                document.getElementById("rayleighStrength") as HTMLElement,
                0,
                40,
                atmosphere.atmosphereUniforms.rayleighStrength * 10,
                (val: number) => {
                    atmosphere.atmosphereUniforms.rayleighStrength = val / 10;
                }
            ),
            new Slider("mieStrength", document.getElementById("mieStrength") as HTMLElement, 0, 40, atmosphere.atmosphereUniforms.mieStrength * 10, (val: number) => {
                atmosphere.atmosphereUniforms.mieStrength = val / 10;
            }),
            new Slider("falloff", document.getElementById("falloff") as HTMLElement, -10, 200, atmosphere.atmosphereUniforms.falloffFactor, (val: number) => {
                atmosphere.atmosphereUniforms.falloffFactor = val;
            }),
            new Slider("redWaveLength", document.getElementById("redWaveLength") as HTMLElement, 0, 1000, atmosphere.atmosphereUniforms.redWaveLength, (val: number) => {
                atmosphere.atmosphereUniforms.redWaveLength = val;
            }),
            new Slider("greenWaveLength", document.getElementById("greenWaveLength") as HTMLElement, 0, 1000, atmosphere.atmosphereUniforms.greenWaveLength, (val: number) => {
                atmosphere.atmosphereUniforms.greenWaveLength = val;
            }),
            new Slider("blueWaveLength", document.getElementById("blueWaveLength") as HTMLElement, 0, 1000, atmosphere.atmosphereUniforms.blueWaveLength, (val: number) => {
                atmosphere.atmosphereUniforms.blueWaveLength = val;
            }),
            new Slider("mieHaloRadius", document.getElementById("mieHaloRadius") as HTMLElement, 0, 200, atmosphere.atmosphereUniforms.mieHaloRadius * 100, (val: number) => {
                atmosphere.atmosphereUniforms.mieHaloRadius = val / 100;
            })
        ];
    }
}
