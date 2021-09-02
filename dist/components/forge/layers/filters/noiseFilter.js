import { normalizedSimplex3FromVector } from "../../../../engine/noiseTools.js";
import { Filter } from "./filter.js";
import { Vector3 } from "../../algebra.js";
export class NoiseFilter extends Filter {
    constructor(settings) {
        super((p, s) => {
            let coords = p.scaleToNew(settings.baseFrequency * s.frequencyModifier);
            coords.addInPlace(Vector3.FromArray(settings.offset));
            let elevation = normalizedSimplex3FromVector(coords);
            return elevation;
        });
        this.settings = settings;
    }
    setModifiers(modifiers) {
        this.filterFunction = (p) => {
            let coords = p.scaleToNew(this.settings.baseFrequency * modifiers.frequencyModifier);
            coords.addInPlace(Vector3.FromArray(this.settings.offset));
            let elevation = normalizedSimplex3FromVector(coords);
            elevation *= this.settings.baseAmplitude;
            elevation = Math.max(0, elevation - this.settings.minValue);
            return elevation;
        };
    }
}
