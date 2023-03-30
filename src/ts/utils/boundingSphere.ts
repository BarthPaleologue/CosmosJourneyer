import { BasicTransform } from "../uberCore/transforms/basicTransform";

export interface BoundingSphere {
    transform: BasicTransform;
    getBoundingRadius(): number;
}
