import { Filter } from "./filter.js";
export class NoiseFilter extends Filter {
    constructor(noiseEngine, settings) {
        super((p) => {
            return settings.baseAmplitude * noiseEngine.normalizedSimplex3FromVector(p.scale(settings.baseFrequency).add(settings.offset));
        });
        this.noiseEngine = noiseEngine;
        this.settings = settings;
    }
    setModifiers(modifiers) {
        this.filterFunction = (p) => {
            return modifiers.strengthModifier * this.settings.baseAmplitude * this.noiseEngine.normalizedSimplex3FromVector(p.scale(this.settings.baseFrequency * modifiers.frequencyModifier).add(this.settings.offset).add(modifiers.offsetModifier));
        };
    }
}
