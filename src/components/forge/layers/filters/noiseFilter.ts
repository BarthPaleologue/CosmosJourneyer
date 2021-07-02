import { NoiseEngine } from "../../../../engine/perlin";
import { Filter } from "./filter.js";
import { NoiseModifiers, NoiseSettings } from "../noiseSettings.js";

export class NoiseFilter extends Filter {
    noiseEngine: NoiseEngine;
    settings: NoiseSettings;

    constructor(noiseEngine: NoiseEngine, settings: NoiseSettings) {
        super((p: BABYLON.Vector3, s: NoiseModifiers) => {
            let coords = p.scale(settings.baseFrequency * s.frequencyModifier);
            coords.addInPlace(BABYLON.Vector3.FromArray(settings.offset));

            let elevation = this.noiseEngine.normalizedSimplex3FromVector(coords);

            return elevation;
        });
        this.noiseEngine = noiseEngine;
        this.settings = settings;
    }
    setModifiers(modifiers: NoiseModifiers) {
        this.filterFunction = (p: BABYLON.Vector3) => {
            let coords = p.scale(this.settings.baseFrequency * modifiers.frequencyModifier);
            coords.addInPlace(BABYLON.Vector3.FromArray(this.settings.offset));
            let elevation = this.noiseEngine.normalizedSimplex3FromVector(coords);
            elevation *= this.settings.baseAmplitude;
            elevation = Math.max(0, elevation - this.settings.minValue);
            return elevation;
        };
    }
}