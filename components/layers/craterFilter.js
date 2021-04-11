import { Filter } from "./filter.js";
export class CraterFilter extends Filter {
    constructor(craters) {
        super((p, s) => {
            let elevation = 0;
            for (let crater of craters) {
                let squaredDistanceToCrater = BABYLON.Vector3.DistanceSquared(p, crater.position);
                let radius = crater.radius / 20 * s.radiusModifier;
                let steepness = crater.steepness * 2 * s.steepnessModifier;
                if (squaredDistanceToCrater <= Math.pow(radius, 2)) {
                    let height = Math.min((squaredDistanceToCrater / (Math.pow(radius, (2)) * steepness)) - 0.4, 0.05);
                    height = Math.max(height, -crater.maxDepth * s.maxDepthModifier) * s.scaleFactor;
                    elevation += height;
                }
            }
            return elevation;
        });
    }
}
