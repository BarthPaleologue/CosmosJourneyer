export class Filter {
    filterFunction: (p: BABYLON.Vector3, s: any) => number;
    constructor(_filterFunction: (p: BABYLON.Vector3, s: any) => number) {
        this.filterFunction = _filterFunction;
    }
    evaluate(p: BABYLON.Vector3, s: any) {
        return this.filterFunction(p, s);
    }
}