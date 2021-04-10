export class Filter {
    constructor(_filterFunction) {
        this.filterFunction = _filterFunction;
    }
    evaluate(p) {
        return this.filterFunction(p);
    }
}
