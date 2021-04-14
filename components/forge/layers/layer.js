export class Layer {
    constructor(_filters, _layerFunction) {
        this.filters = _filters;
        this.layerFunction = _layerFunction;
    }
    evaluate(p, s) {
        return this.layerFunction(p, this.filters, s);
    }
}
