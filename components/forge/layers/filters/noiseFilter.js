import { Filter } from "./filter.js";
export class NoiseFilter extends Filter {
    constructor(noiseEngine, settings) {
        super((p, s) => {
            return settings.baseAmplitude * s.amplitudeModifier * noiseEngine.normalizedSimplex3FromVector(p.scale(settings.baseFrequency * s.frequencyModifier).add(BABYLON.Vector3.FromArray(settings.offset)).add(BABYLON.Vector3.FromArray(s.offsetModifier)));
        });
        this.noiseEngine = noiseEngine;
        this.settings = settings;
    }
    setModifiers(modifiers) {
        this.filterFunction = (p) => {
            return modifiers.strengthModifier * this.settings.baseAmplitude * this.noiseEngine.normalizedSimplex3FromVector(p.scale(this.settings.baseFrequency * modifiers.frequencyModifier).add(BABYLON.Vector3.FromArray(this.settings.offset)).add(BABYLON.Vector3.FromArray(modifiers.offsetModifier)));
        };
    }
}
