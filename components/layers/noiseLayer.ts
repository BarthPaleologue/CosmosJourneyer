import { NoiseEngine } from "../../engine/perlin.js";
import { Filter } from "./filter.js";
import { Layer } from "./layer.js";
import { NoiseFilter } from "./noiseFilter.js";
import { NoiseModifiers, NoiseSettings } from "./noiseSettings.js";

export class NoiseLayer extends Layer {
    masks: number[];
    filters: NoiseFilter[];
    settings: NoiseSettings;
    constructor(noiseEngine: NoiseEngine, settings: NoiseSettings, _masks: number[] = []) {
        super([], (p: BABYLON.Vector3, f: Filter[], s: NoiseModifiers) => 0);

        let filters = [];
        for (let i = 0; i < settings.octaves; i++) {
            filters.push(new NoiseFilter(noiseEngine, {
                noiseStrength: 1,
                octaves: settings.octaves,
                minValue: settings.minValue,
                decay: settings.decay,
                baseAmplitude: settings.baseAmplitude / (settings.decay ** i),
                baseFrequency: settings.baseFrequency * (2 ** i),
                offset: settings.offset,
            }));
        }
        this.layerFunction = (p: BABYLON.Vector3, f: Filter[], s: NoiseModifiers) => {
            let elevation = 0;
            for (let filter of f) {
                elevation += filter.evaluate(p, s);
            }
            elevation = Math.max(0, elevation - settings.minValue * s.minValueModifier * f.length);
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