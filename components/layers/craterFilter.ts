import { Crater } from "../crater.js";
import { CraterModifiers } from "./craterModifiers.js";
import { Filter } from "./filter.js";

export class CraterFilter extends Filter {
    constructor(craters: Crater[]) {
        super((p: BABYLON.Vector3, s: CraterModifiers) => {
            let elevation = 0;
            for (let crater of craters) {
                let d = BABYLON.Vector3.DistanceSquared(p, BABYLON.Vector3.FromArray(crater.position));
                let radius = crater.radius * s.radiusModifier;
                let steepness = crater.steepness * s.steepnessModifier;

                //console.log(crater.position);

                if (d <= radius ** 2) {
                    let height = Math.min((d / ((radius * steepness) ** 2)) - 0.4, 0.05);
                    height = Math.max(height, -crater.maxDepth * s.maxDepthModifier) * s.scaleFactor;
                    elevation += height;
                }
            }
            return elevation;
        });
    }
}