import { Filter } from "./filter.js";
export class NoiseFilter extends Filter {
    constructor(noiseEngine, settings) {
        super((p, s) => {
            let coords = p.scale(settings.baseFrequency * s.frequencyModifier);
            coords.addInPlace(BABYLON.Vector3.FromArray(settings.offset));
            let elevation = this.noiseEngine.normalizedSimplex3FromVector(coords);
            return elevation;
        });
        this.noiseEngine = noiseEngine;
        this.settings = settings;
    }
    setModifiers(modifiers) {
        this.filterFunction = (p) => {
            let coords = p.scale(this.settings.baseFrequency * modifiers.frequencyModifier);
            coords.addInPlace(BABYLON.Vector3.FromArray(this.settings.offset));
            let elevation = this.noiseEngine.normalizedSimplex3FromVector(coords);
            elevation *= this.settings.baseAmplitude;
            elevation = Math.max(0, elevation - this.settings.minValue);
            return elevation;
        };
    }
}
