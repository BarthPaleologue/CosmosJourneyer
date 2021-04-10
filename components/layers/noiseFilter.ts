import { NoiseEngine } from "../../engine/perlin.js";
import { Filter } from "./filter.js";
import { NoiseModifiers, NoiseSettings } from "./noiseSettings.js";

export class NoiseFilter extends Filter {
    noiseEngine: NoiseEngine;
    settings: NoiseSettings;

    constructor(noiseEngine: NoiseEngine, settings: NoiseSettings) {
        super((p: BABYLON.Vector3) => {
            return settings.baseAmplitude * noiseEngine.normalizedSimplex3FromVector(p.scale(settings.baseFrequency).add(settings.offset));
        });
        this.noiseEngine = noiseEngine;
        this.settings = settings;
    }
    setModifiers(modifiers: NoiseModifiers) {
        this.filterFunction = (p: BABYLON.Vector3) => {
            return modifiers.strengthModifier * this.settings.baseAmplitude * this.noiseEngine.normalizedSimplex3FromVector(p.scale(this.settings.baseFrequency * modifiers.frequencyModifier).add(this.settings.offset).add(modifiers.offsetModifier));
        };
    }
}