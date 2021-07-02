import { Crater } from "../crater.js";
import { CraterFilter } from "./filters/craterFilter.js";
import { Filter } from "./filters/filter.js";
import { Layer } from "./layer.js";

export class CraterLayer extends Layer {
    constructor(craters: Crater[]) {
        let craterFilter = new CraterFilter(craters);
        super([craterFilter], (p: BABYLON.Vector3, f: Filter[], s: number) => {
            let elevation = 0;
            for (let filter of f) {
                elevation += filter.evaluate(p, s);
            }
            return elevation;
        });
    }
    regenerate(craters: Crater[]) {
        let craterFilter = new CraterFilter(craters);
        this.filters = [craterFilter];
    }
}