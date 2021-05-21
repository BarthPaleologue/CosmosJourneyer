import { Layer } from "./layer.js";
import { NoiseFilter } from "./filters/noiseFilter.js";
export class NoiseLayer extends Layer {
    constructor(noiseEngine, settings, _masks = []) {
        super([], (p, f, s) => 0);
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
                useCraterMask: settings.useCraterMask
            }));
        }
        this.layerFunction = (p, f, s) => {
            let elevation = 0;
            for (let i = 0; i < f.length; i++) {
                elevation += f[i].evaluate(p, s) / (Math.pow(settings.decay, i));
            }
            elevation /= f.length; // normalisation de la hauteur entre 0 et 1
            elevation = Math.max(0, elevation - settings.minValue); // effet de seuil (valeurs entre 0 et 1 - minValue)
            elevation /= 1 - settings.minValue; // re normalisation
            elevation *= settings.baseAmplitude; // on stretch
            return elevation * s.strengthModifier;
        };
        this.masks = _masks;
        this.filters = filters;
        this.settings = settings;
    }
    setModifiers(modifiers) {
        for (let filter of this.filters) {
            filter.setModifiers(modifiers);
        }
    }
}
