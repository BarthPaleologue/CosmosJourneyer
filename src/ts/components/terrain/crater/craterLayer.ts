import { Crater } from "./crater";
import {Vector3} from "@babylonjs/core";

export class CraterLayer {
    private _craters: Crater[];
    constructor(craters: Crater[]) {
        this._craters = craters;
    }
    evaluate(p: Vector3) {
        let elevation = 0;

        for (let crater of this._craters) {
            let d = Vector3.Distance(p, new Vector3(crater.position[0], crater.position[1], crater.position[2]));

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