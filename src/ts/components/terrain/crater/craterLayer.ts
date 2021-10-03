import { Vector3 } from "../../toolbox/algebra";
import { Crater } from "./crater";
import { CraterFilter } from "./craterFilter";
import { Filter } from "../../forge/layers/filters/filter";
import { Layer } from "../../forge/layers/layer";

export class CraterLayer extends Layer {
    constructor(craters: Crater[]) {
        let craterFilter = new CraterFilter(craters);
        super([craterFilter], (p: Vector3, f: Filter[], s: number) => {
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