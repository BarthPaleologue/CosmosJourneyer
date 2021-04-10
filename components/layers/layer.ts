import { Filter } from "./filter.js";
import { NoiseSettings } from "./noiseSettings.js";

export class Layer {
    filters: Filter[];
    layerFunction: (p: BABYLON.Vector3, f: Filter[], s: number) => number;
    constructor(_filters: Filter[], _layerFunction: (p: BABYLON.Vector3, f: Filter[], s: number) => number) {
        this.filters = _filters;
        this.layerFunction = _layerFunction;
    }
    evaluate(p: BABYLON.Vector3, s: number) {
        return this.layerFunction(p, this.filters, s);
    }
}