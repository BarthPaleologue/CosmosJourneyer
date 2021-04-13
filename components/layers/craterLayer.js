import { CraterFilter } from "./craterFilter.js";
import { Layer } from "./layer.js";
export class CraterLayer extends Layer {
    constructor(craters) {
        let craterFilter = new CraterFilter(craters);
        super([craterFilter], (p, f, s) => {
            let elevation = 0;
            for (let filter of f) {
                elevation += filter.evaluate(p, s);
            }
            return elevation;
        });
    }
    regenerate(craters) {
        let craterFilter = new CraterFilter(craters);
        this.filters = [craterFilter];
    }
}
