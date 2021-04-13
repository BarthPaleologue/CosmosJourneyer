import { Filter } from "./filter.js";
export class CraterFilter extends Filter {
    constructor(craters) {
        super((p, s) => {
            let elevation = 0;
            for (let crater of craters) {
                let d = BABYLON.Vector3.DistanceSquared(p, BABYLON.Vector3.FromArray(crater.position));
                let radius = crater.radius * s.radiusModifier;
                let steepness = crater.steepness * s.steepnessModifier;
                //console.log(crater.position);
                if (d <= Math.pow(radius, 2)) {
                    let height = Math.min((d / (Math.pow((radius * steepness), 2))) - 0.4, 0.05);
                    height = Math.max(height, -crater.maxDepth * s.maxDepthModifier) * s.scaleFactor;
                    elevation += height;
                }
            }
            return elevation;
        });
    }
}
