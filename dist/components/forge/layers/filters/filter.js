export class Filter {
    constructor(_filterFunction) {
        this.filterFunction = _filterFunction;
    }
    evaluate(p, s) {
        return this.filterFunction(p, s);
    }
}
