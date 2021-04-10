export class Filter {
    filterFunction: (p: BABYLON.Vector3) => number;
    constructor(_filterFunction: (p: BABYLON.Vector3) => number) {
        this.filterFunction = _filterFunction;
    }
    evaluate(p: BABYLON.Vector3) {
        return this.filterFunction(p);
    }
}