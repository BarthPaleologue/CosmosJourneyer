import { Layer } from "./layer.js";
import { NoiseFilter } from "./noiseFilter.js";
export class NoiseLayer extends Layer {
    constructor(noiseEngine, settings, _masks = []) {
        let filters = [];
        for (let i = 0; i < settings.octaves; i++) {
            filters.push(new NoiseFilter(noiseEngine, {
                noiseStrength: 1,
                octaves: settings.octaves,
                minValue: settings.minValue,
                decay: settings.decay,
                baseAmplitude: settings.baseAmplitude / (Math.pow(settings.decay, i)),
                baseFrequency: settings.baseFrequency * (Math.pow(2, i)),
                offset: settings.offset,
            }));
        }
        super(filters, (p, f, s) => {
            let elevation = 0;
            for (let filter of f) {
                elevation += filter.evaluate(p, s);
            }
            elevation = Math.max(0, elevation - settings.minValue * s.minValueModifier * f.length);
            return elevation * s.strengthModifier;
        });
        this.masks = _masks;
        this.filters = filters;
    }
    setModifiers(modifiers) {
        for (let filter of this.filters) {
            filter.setModifiers(modifiers);
        }
    }
}
