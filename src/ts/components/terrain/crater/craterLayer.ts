import { Vector3 } from "../../toolbox/algebra";
import { Crater } from "./crater";

export class CraterLayer {
    private _craters: Crater[];
    constructor(craters: Crater[]) {
        this._craters = craters;
    }
    evaluate(p: Vector3) {
        let elevation = 0;

        for (let crater of this._craters) {
            let d = Vector3.Distance(p, Vector3.FromArray(crater.position));

            let radius = crater.radius;
            let steepness = crater.steepness;

            if (d <= radius) {
                let depth = (((d / radius) ** steepness) - 1);

                elevation += 30 * 1e3 * radius * depth;
            }
        }
        return elevation;
    }

    set craters(craters: Crater[]) {
        this._craters = craters;
    }

    get craters(): Crater[] {
        return this._craters;
    }
}