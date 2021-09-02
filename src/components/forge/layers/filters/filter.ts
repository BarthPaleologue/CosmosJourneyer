import { Vector3 } from "../../algebra";

export class Filter {
    filterFunction: (p: Vector3, s: any) => number;
    constructor(_filterFunction: (p: Vector3, s: any) => number) {
        this.filterFunction = _filterFunction;
    }
    evaluate(p: Vector3, s: any) {
        return this.filterFunction(p, s);
    }
}