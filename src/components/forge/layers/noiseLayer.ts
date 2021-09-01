import { Filter } from "./filters/filter.js";
import { Layer } from "./layer.js";
import { NoiseFilter } from "./filters/noiseFilter.js";
import { NoiseModifiers, NoiseSettings } from "./noiseSettings.js";

export class NoiseLayer extends Layer {
    masks: number[];
    filters: NoiseFilter[];
    settings: NoiseSettings;
    constructor(settings: NoiseSettings, _masks: number[] = []) {
        super([], (p: BABYLON.Vector3, f: Filter[], s: NoiseModifiers) => 0);

        let filters = [];
        for (let i = 0; i < settings.octaves; i++) {
            filters.push(new NoiseFilter({
                noiseStrength: 1,
                octaves: settings.octaves,
                minValue: settings.minValue,
                decay: settings.decay,
                baseAmplitude: settings.baseAmplitude / (settings.decay ** i),
                baseFrequency: settings.baseFrequency * (2 ** i),
                offset: settings.offset,
                useCraterMask: settings.useCraterMask
            }));
        }
        this.layerFunction = (p: BABYLON.Vector3, f: Filter[], s: NoiseModifiers) => {
            let elevation = 0;
            for (let i = 0; i < f.length; i++) {
                elevation += f[i].evaluate(p, s) / (settings.decay ** i);
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
    setModifiers(modifiers: NoiseModifiers) {
        for (let filter of this.filters) {
            filter.setModifiers(modifiers);
        }
    }
}