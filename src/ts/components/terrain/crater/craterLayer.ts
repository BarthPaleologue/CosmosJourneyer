import { Vector3 } from "../../toolbox/algebra";
import { Crater } from "./crater";
import { CraterModifiers } from "./craterModifiers";

export class CraterLayer {
    private _craters: Crater[];
    private _craterModifiers: CraterModifiers;
    constructor(craters: Crater[], craterModifiers: CraterModifiers = {
        radiusModifier: 1,
        steepnessModifier: 1,
        maxDepthModifier: 1,
        scaleFactor: 1
    }) {
        this._craters = craters;
        this._craterModifiers = craterModifiers;
    }
    evaluate(p: Vector3) {
        let elevation = 0;

        for (let crater of this._craters) {
            let d = Vector3.Distance(p, Vector3.FromArray(crater.position));

            let radius = crater.radius * this._craterModifiers.radiusModifier;
            let steepness = crater.steepness * this._craterModifiers.steepnessModifier;

            if (d <= radius) {
                let depth = ((d / radius) ** 8 - 1) * this._craterModifiers.maxDepthModifier;

                elevation += 30 * 1e3 * radius * depth * this._craterModifiers.scaleFactor;
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

    set craterModifiers(craterModifiers: CraterModifiers) {
        this._craterModifiers = craterModifiers;
    }
}