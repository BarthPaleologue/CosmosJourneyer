import { EditorPanel } from "../editorPanel";
import { clearAllEventListenersById } from "../../../utils/html";
import { Settings } from "../../../settings";
import { Slider } from "handle-sliderjs";
import { Planet } from "../../../bodies/planets/planet";

export class AtmospherePanel extends EditorPanel {
    constructor() {
        super("atmosphere");
    }
    init(planet: Planet) {
        for (const slider of this.sliders) slider.remove();

        const atmosphere = planet.postProcesses.atmosphere;
        if (atmosphere == null) return;

        const atmosphereToggler = clearAllEventListenersById("atmosphereToggler");
        atmosphereToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[2] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            atmosphere.settings.atmosphereRadius = checkbox.checked ? Settings.EARTH_RADIUS + Settings.ATMOSPHERE_HEIGHT : 0;
        });
        this.sliders = [
            new Slider("intensity", document.getElementById("intensity") as HTMLElement, 0, 40, atmosphere.settings.intensity, (val: number) => {
                atmosphere.settings.intensity = val;
            }),
            new Slider("density", document.getElementById("density") as HTMLElement, 0, 40, atmosphere.settings.densityModifier * 10, (val: number) => {
                atmosphere.settings.densityModifier = val / 10;
            }),
            new Slider(
                "atmosphereRadius",
                document.getElementById("atmosphereRadius") as HTMLElement,
                0,
                100,
                (atmosphere.settings.atmosphereRadius - planet.getRadius()) / 10000,
                (val: number) => {
                    atmosphere.settings.atmosphereRadius = planet.getRadius() + val * 10000;
                }
            ),
            new Slider("rayleighStrength", document.getElementById("rayleighStrength") as HTMLElement, 0, 40, atmosphere.settings.rayleighStrength * 10, (val: number) => {
                atmosphere.settings.rayleighStrength = val / 10;
            }),
            new Slider("mieStrength", document.getElementById("mieStrength") as HTMLElement, 0, 40, atmosphere.settings.mieStrength * 10, (val: number) => {
                atmosphere.settings.mieStrength = val / 10;
            }),
            new Slider("falloff", document.getElementById("falloff") as HTMLElement, -10, 200, atmosphere.settings.falloffFactor, (val: number) => {
                atmosphere.settings.falloffFactor = val;
            }),
            new Slider("redWaveLength", document.getElementById("redWaveLength") as HTMLElement, 0, 1000, atmosphere.settings.redWaveLength, (val: number) => {
                atmosphere.settings.redWaveLength = val;
            }),
            new Slider("greenWaveLength", document.getElementById("greenWaveLength") as HTMLElement, 0, 1000, atmosphere.settings.greenWaveLength, (val: number) => {
                atmosphere.settings.greenWaveLength = val;
            }),
            new Slider("blueWaveLength", document.getElementById("blueWaveLength") as HTMLElement, 0, 1000, atmosphere.settings.blueWaveLength, (val: number) => {
                atmosphere.settings.blueWaveLength = val;
            }),
            new Slider("mieHaloRadius", document.getElementById("mieHaloRadius") as HTMLElement, 0, 200, atmosphere.settings.mieHaloRadius * 100, (val: number) => {
                atmosphere.settings.mieHaloRadius = val / 100;
            })
        ];
    }
}