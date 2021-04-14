import { Crater } from "../crater.js";
import { CraterModifiers } from "./craterModifiers.js";
import { Filter } from "./filters/filter.js";

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
                    let depth = 10;
                    let height = depth * (d / ((radius) ** 2)) - depth;
                    //let border = 100 * depth * radius ** 2 * (((Math.sqrt(d) / radius) - 1) ** 2);
                    //let border = 10 * Math.exp(-d * 1000); //- depth / 100;
                    let plancher = Math.max(height, -depth * 0.3);
                    //elevation += border;
                    elevation += Math.max(height, plancher);
                    //elevation += Math.min(height, border);
                    //elevation += Math.max(Math.min(height, border), plancher);
                    //let height = Math.min((d / ((radius * steepness) ** 2)) - 0.4, 0.05);
                    //height = Math.max(height, -crater.maxDepth * s.maxDepthModifier) * s.scaleFactor;
                    //elevation += height;
                }
            }
            return elevation;
        });
    }
}