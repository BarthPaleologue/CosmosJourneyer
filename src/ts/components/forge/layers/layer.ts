import { Vector3 } from "../../toolbox/algebra";
import { Filter } from "./filters/filter";

export class Layer {
    filters: Filter[];
    layerFunction: (p: Vector3, f: Filter[], s: any) => number;
    constructor(_filters: Filter[], _layerFunction: (p: Vector3, f: Filter[], s: any) => number) {
        this.filters = _filters;
        this.layerFunction = _layerFunction;
    }
    evaluate(p: Vector3, s: any) {
        return this.layerFunction(p, this.filters, s);
    }
}