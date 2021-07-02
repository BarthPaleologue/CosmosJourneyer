import { Filter } from "./filters/filter.js";

export class Layer {
    filters: Filter[];
    layerFunction: (p: BABYLON.Vector3, f: Filter[], s: any) => number;
    constructor(_filters: Filter[], _layerFunction: (p: BABYLON.Vector3, f: Filter[], s: any) => number) {
        this.filters = _filters;
        this.layerFunction = _layerFunction;
    }
    evaluate(p: BABYLON.Vector3, s: any) {
        return this.layerFunction(p, this.filters, s);
    }
}