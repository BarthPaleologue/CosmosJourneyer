import { NoiseEngine } from "../../engine/perlin.js";
import { Filter } from "./filter.js";
import { Layer } from "./layer.js";
import { NoiseFilter } from "./noiseFilter.js";
import { NoiseModifiers, NoiseSettings } from "./noiseSettings.js";

export class NoiseLayer extends Layer {
    masks: number[];
    filters: NoiseFilter[];
    constructor(noiseEngine: NoiseEngine, settings: NoiseSettings, _masks: number[] = []) {
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
        super(filters, (p: BABYLON.Vector3, f: Filter[], s: number) => {
            let elevation = 0;
            for (let filter of f) {
                elevation += filter.evaluate(p);
            }
            elevation = Math.max(0, elevation - settings.minValue * f.length);
            return elevation * s;
        });
        this.masks = _masks;
        this.filters = filters;
    }
    setModifiers(modifiers: NoiseModifiers) {
        for (let filter of this.filters) {
            filter.setModifiers(modifiers);
        }
    }
}